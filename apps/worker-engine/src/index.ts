import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient } from 'db-prisma';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { MetaGraphApiClient } from 'facebook-client';
import { SecretManager } from 'secret-manager';
import { startOutboxDispatcher } from './outbox-dispatcher';
import { createFacebookPublishWorker } from './publish-worker';
import { runSourceScraper } from './workers/scraper-worker';
import { runAiGenerationWorker } from './workers/ai-worker';

const prisma = new PrismaClient();
const secretManager = new SecretManager();
const facebookClient = new MetaGraphApiClient();

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

export const facebookPublishQueue = new Queue('queue.facebook-publish', {
  connection: redisConnection,
});

startOutboxDispatcher(prisma, facebookPublishQueue);

createFacebookPublishWorker(redisConnection, prisma, secretManager, facebookClient);

setInterval(() => {
  runSourceScraper(prisma).catch((err) => console.error('[Scraper Worker Error]:', err));
}, 5 * 60 * 1000);

setInterval(() => {
  runAiGenerationWorker(prisma).catch((err) => console.error('[AI Worker Error]:', err));
}, 2 * 60 * 1000);

console.log('[Worker Engine] Engine running with Scraper, AI Generator, Outbox Dispatcher, and Facebook Publisher.');
