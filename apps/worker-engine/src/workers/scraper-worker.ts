import crypto from 'crypto';
import { PrismaClient } from 'db-prisma';
import { RssScraperAdapter, CheerioScraperAdapter } from 'scraper-adapters';

export async function runSourceScraper(prisma: PrismaClient) {
  const activeSources = await prisma.source.findMany({
    where: { status: 'ACTIVE' },
  });

  const rssAdapter = new RssScraperAdapter();
  const cheerioAdapter = new CheerioScraperAdapter();

  for (const source of activeSources) {
    try {
      const adapter = source.type === 'RSS' ? rssAdapter : cheerioAdapter;
      const articles = await adapter.fetchArticles(source.url, source.selectorsJson);

      let createdCount = 0;
      for (const item of articles) {
        const existing = await prisma.article.findUnique({
          where: { canonicalUrl: item.canonicalUrl },
        });

        if (!existing) {
          const article = await prisma.article.create({
            data: {
              sourceId: source.id,
              externalId: item.externalId,
              canonicalUrl: item.canonicalUrl,
              urlHash: crypto.randomUUID(),
              title: item.title,
              rawSummary: item.rawSummary,
              rawContent: item.rawContent,
              author: item.author,
              publishedAt: item.publishedAt,
            },
          });

          await prisma.extractionMetadata.create({
            data: {
              articleId: article.id,
              rawHtmlHash: crypto.randomUUID(),
              httpStatus: 200,
              headersJson: {},
            },
          });

          createdCount++;
        }
      }

      await prisma.sourceRun.create({
        data: {
          sourceId: source.id,
          status: 'SUCCESS',
          itemCount: createdCount,
        },
      });

      await prisma.source.update({
        where: { id: source.id },
        data: { lastRunAt: new Date(), failureCount: 0 },
      });
    } catch (error: any) {
      console.error(`[Scraper] Failed for source ${source.name}:`, error.message);
      await prisma.sourceRun.create({
        data: {
          sourceId: source.id,
          status: 'FAILED',
          errorMessage: error.message,
        },
      });

      await prisma.source.update({
        where: { id: source.id },
        data: { failureCount: { increment: 1 } },
      });
    }
  }
}
