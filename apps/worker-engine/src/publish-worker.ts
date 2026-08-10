import { PrismaClient, PublicationStatus } from 'db-prisma';
import { Worker, Job } from 'bullmq';
import { MetaGraphApiClient } from 'facebook-client';
import { SecretManager } from 'secret-manager';

export function createFacebookPublishWorker(
  connection: any,
  prisma: PrismaClient,
  secretManager: SecretManager,
  facebookClient: MetaGraphApiClient,
  workerId = 'worker-engine-1'
) {
  return new Worker(
    'queue.facebook-publish',
    async (job: Job) => {
      const { publicationId, facebookPageId, idempotencyKey } = job.data;
      console.log(`[Worker] Received Job for Publication: ${publicationId}`);

      const now = new Date();

      // 1. ATOMIC CONDITIONAL CLAIM
      const claimResult = await prisma.publication.updateMany({
        where: {
          id: publicationId,
          facebookPageId: facebookPageId,
          idempotencyKey: idempotencyKey,
          status: { in: ['QUEUED', 'RETRY_WAIT'] },
          scheduledAt: { lte: now },
        },
        data: {
          status: 'PUBLISHING',
          leaseOwner: workerId,
          leaseExpiresAt: new Date(Date.now() + 120000),
          requestStartedAt: now,
        },
      });

      if (claimResult.count === 0) {
        console.warn(`[Worker] Claim rejected for publication ${publicationId}. Skipping job.`);
        return;
      }

      // 2. FETCH PUBLICATION DETAILS & ENFORCE BUSINESS ELIGIBILITY
      const publication = await prisma.publication.findUnique({
        where: { id: publicationId },
        include: {
          post: { include: { article: true } },
          postRevision: { include: { mediaAsset: true } },
          facebookPage: true,
          attempts: { orderBy: { attemptNumber: 'desc' }, take: 1 },
        },
      });

      if (!publication) {
        throw new Error(`Publication ${publicationId} not found.`);
      }

      const attemptNumber = (publication.attempts[0]?.attemptNumber || 0) + 1;

      const isApproved = publication.post.reviewStatus === 'APPROVED';
      const isCurrentRevision = publication.post.currentRevisionId === publication.postRevisionId;
      const isPageValid = publication.facebookPage.isValid;
      const mediaAsset = publication.postRevision.mediaAsset;

      const isMediaValid = !mediaAsset || (mediaAsset.isApproved && mediaAsset.rightsStatus !== 'UNKNOWN');

      if (!isApproved || !isCurrentRevision || !isPageValid || !isMediaValid) {
        const reason = `Eligibility Failed: approved=${isApproved}, currentRev=${isCurrentRevision}, pageValid=${isPageValid}, mediaValid=${isMediaValid}`;
        console.error(`[Worker] ${reason}`);

        await prisma.publicationAttempt.create({
          data: {
            publicationId,
            attemptNumber,
            status: 'FAILED_PERMANENT',
            errorMessage: reason,
          },
        });

        await prisma.publication.update({
          where: { id: publicationId },
          data: { status: 'FAILED_PERMANENT' },
        });

        return;
      }

      // 3. RECORD ATTEMPT BEFORE CALLING META API
      await prisma.publicationAttempt.create({
        data: {
          publicationId,
          attemptNumber,
          status: 'PUBLISHING',
        },
      });

      const pageAccessToken = secretManager.decrypt(publication.facebookPage.encryptedAccessToken);

      let caption = publication.postRevision.caption;
      if (publication.post.article?.canonicalUrl) {
        caption += `\n\nNguồn: ${publication.post.article.canonicalUrl}`;
      }

      // 4. CALL META API WITH CLASSIFIED ERROR HANDLING
      try {
        const response = await facebookClient.publishFeedPost(
          publication.facebookPage.pageId,
          pageAccessToken,
          {
            caption,
            linkUrl: publication.post.article?.canonicalUrl,
          }
        );

        await prisma.$transaction(async (tx: any) => {
          await tx.publication.update({
            where: { id: publicationId },
            data: {
              status: 'PUBLISHED',
              fbPostId: response.id,
              publishedAt: new Date(),
              requestCompletedAt: new Date(),
            },
          });

          await tx.publicationAttempt.create({
            data: {
              publicationId,
              attemptNumber: attemptNumber + 1,
              status: 'PUBLISHED',
              rawResponse: JSON.parse(JSON.stringify(response)),
            },
          });
        });

        console.log(`[Worker] Publication SUCCESS: ${response.id}`);
      } catch (error: any) {
        const classified = facebookClient.classifyError(error);

        let nextStatus: PublicationStatus;

        if (classified.isTransient) {
          if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || !error.response) {
            nextStatus = 'UNKNOWN';
          } else {
            nextStatus = 'RETRY_WAIT';
          }
        } else {
          nextStatus = 'FAILED_PERMANENT';
        }

        await prisma.$transaction(async (tx: any) => {
          await tx.publication.update({
            where: { id: publicationId },
            data: {
              status: nextStatus,
              requestCompletedAt: new Date(),
            },
          });

          await tx.publicationAttempt.create({
            data: {
              publicationId,
              attemptNumber: attemptNumber + 1,
              status: nextStatus,
              httpStatusCode: classified.httpStatusCode,
              errorCode: classified.errorCode,
              errorMessage: classified.errorMessage,
              rawResponse: error.response?.data ? JSON.parse(JSON.stringify(error.response.data)) : undefined,
            },
          });
        });

        console.error(`[Worker] Meta API Failure (${classified.errorMessage}) -> Moved to ${nextStatus}`);

        if (nextStatus === 'RETRY_WAIT') {
          throw error;
        }
      }
    },
    { connection, concurrency: 2 }
  );
}
