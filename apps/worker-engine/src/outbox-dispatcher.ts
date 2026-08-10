import { PrismaClient } from 'db-prisma';
import { Queue } from 'bullmq';

export async function startOutboxDispatcher(prisma: PrismaClient, publishQueue: Queue, workerId = 'worker-engine-1') {
  console.log('[Outbox Dispatcher] Starting outbox event processing loop...');

  setInterval(async () => {
    try {
      const now = new Date();

      const pendingEvents = await prisma.outboxEvent.findMany({
        where: {
          scheduledAt: { lte: now },
          OR: [
            { status: 'PENDING' },
            {
              status: 'PROCESSING',
              leaseExpiresAt: { lt: now },
            },
          ],
        },
        take: 20,
        orderBy: { scheduledAt: 'asc' },
      });

      for (const event of pendingEvents) {
        const lockAcquired = await prisma.outboxEvent.updateMany({
          where: {
            id: event.id,
            status: event.status,
          },
          data: {
            status: 'PROCESSING',
            lockedBy: workerId,
            lockedAt: now,
            leaseExpiresAt: new Date(Date.now() + 60000),
            retryCount: { increment: 1 },
          },
        });

        if (lockAcquired.count === 0) continue;

        try {
          if (event.eventType === 'PUBLICATION_QUEUED') {
            await publishQueue.add('publish-facebook-post', event.payloadJson, {
              jobId: event.dedupeKey,
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 60000,
              },
            });
          }

          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: 'PROCESSED',
              processedAt: new Date(),
            },
          });
        } catch (queueErr: any) {
          console.error(`[Outbox Dispatcher] Failed to enqueue event ${event.id}:`, queueErr);
          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: 'PENDING',
              errorMessage: queueErr.message,
            },
          });
        }
      }
    } catch (error) {
      console.error('[Outbox Dispatcher Error]:', error);
    }
  }, 1000);

  setInterval(async () => {
    try {
      const queuedPublications = await prisma.publication.findMany({
        where: {
          status: 'QUEUED',
          scheduledAt: { lte: new Date() },
        },
        take: 50,
      });

      for (const pub of queuedPublications) {
        const dedupeKey = `pub_reconcile_${pub.id}_${pub.updatedAt.getTime()}`;
        const existingEvent = await prisma.outboxEvent.findUnique({
          where: { dedupeKey },
        });

        if (!existingEvent) {
          await prisma.outboxEvent.create({
            data: {
              dedupeKey,
              aggregateType: 'PUBLICATION',
              aggregateId: pub.id,
              eventType: 'PUBLICATION_QUEUED',
              payloadJson: {
                publicationId: pub.id,
                facebookPageId: pub.facebookPageId,
                idempotencyKey: pub.idempotencyKey,
              },
              status: 'PENDING',
              scheduledAt: new Date(),
            },
          });
          console.log(`[Outbox Reconciler] Re-created missing outbox event for publication ${pub.id}`);
        }
      }
    } catch (err) {
      console.error('[Outbox Reconciler Error]:', err);
    }
  }, 30000);
}
