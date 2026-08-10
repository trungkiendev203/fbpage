import crypto from 'crypto';
import { PrismaClient } from 'db-prisma';
import { GeminiRewriterService } from 'ai-gemini';

export async function runAiGenerationWorker(prisma: PrismaClient) {
  let activePrompt = await prisma.promptVersion.findFirst({
    where: { isActive: true },
  });

  if (!activePrompt) {
    activePrompt = await prisma.promptVersion.create({
      data: {
        version: 1,
        promptTemplate: 'Tiêu đề: {title}',
        jsonSchema: {},
        modelName: 'gemini-2.5-flash',
        isActive: true,
      },
    });
  }

  // CHỈ LẤY BÀI TIN TƯƠI MỚI NHẤT TRONG NỬA TIẾNG QUA (Tránh cào bài cũ đăng lại)
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

  const unprocessedArticles = await prisma.article.findMany({
    where: {
      posts: { none: {} },
      fetchedAt: { gte: thirtyMinsAgo },
    },
    take: 1, // Chỉ đăng ĐÚNG 1 BÀI MỚI NHẤT
    orderBy: { fetchedAt: 'desc' },
  });

  if (unprocessedArticles.length === 0) {
    return;
  }

  const rewriter = new GeminiRewriterService();
  const defaultPage = await prisma.facebookPage.findFirst({
    where: { isValid: true },
  });

  for (const article of unprocessedArticles) {
    try {
      const result = await rewriter.rewriteArticle(
        article.title,
        article.rawSummary || '',
        article.rawContent || undefined
      );

      await prisma.$transaction(async (tx: any) => {
        const isApproved = !result.sensitivity_flag;

        const post = await tx.post.create({
          data: {
            articleId: article.id,
            promptVersionId: activePrompt.id,
            generationStatus: 'GENERATED',
            reviewStatus: isApproved ? 'APPROVED' : 'DRAFT',
            sensitivityFlag: result.sensitivity_flag,
            isAutoPublishEligible: isApproved,
          },
        });

        const revision = await tx.postRevision.create({
          data: {
            postId: post.id,
            revisionNumber: 1,
            caption: result.facebook_caption,
            inputHash: crypto.randomUUID(),
            aiResponseRaw: JSON.parse(JSON.stringify(result)),
          },
        });

        await tx.post.update({
          where: { id: post.id },
          data: { currentRevisionId: revision.id },
        });

        // TỰ ĐỘNG ĐĂNG BÀI MỚI NHẤT LÊN FANPAGE FACEBOOK
        if (defaultPage && isApproved) {
          const pub = await tx.publication.create({
            data: {
              postId: post.id,
              postRevisionId: revision.id,
              facebookPageId: defaultPage.id,
              status: 'QUEUED',
              scheduledAt: new Date(),
              idempotencyKey: `auto-pub-${post.id}-${revision.id}`,
            },
          });

          await tx.outboxEvent.create({
            data: {
              dedupeKey: `outbox-${pub.id}`,
              aggregateType: 'PUBLICATION',
              aggregateId: pub.id,
              eventType: 'PUBLICATION_QUEUED',
              payloadJson: {
                publicationId: pub.id,
                facebookPageId: defaultPage.id,
                idempotencyKey: pub.idempotencyKey,
              },
            },
          });

          console.log(`[AI Worker] Auto-publish queued for latest article: "${article.title}" -> Fanpage: "${defaultPage.name}"`);
        }
      });

      console.log(`[AI Worker] Generated & Auto-Approved latest article: ${article.title}`);
    } catch (err: any) {
      console.error(`[AI Worker] Generation error for article ${article.id}:`, err.message);
    }
  }
}
