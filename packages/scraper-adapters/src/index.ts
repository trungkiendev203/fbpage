import crypto from 'crypto';
import { URL } from 'url';
import * as cheerio from 'cheerio';
import RssParser from 'rss-parser';
import { ScrapedArticleResult } from 'shared-types';
import { SsrfValidator } from 'media-processor';

export class UrlNormalizer {
  public static normalize(rawUrl: string): { normalizedUrl: string; urlHash: string } {
    const parsed = new URL(rawUrl);
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.hash = '';

    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref'];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));

    parsed.searchParams.sort();
    const normalizedUrl = parsed.toString();
    const urlHash = crypto.createHash('sha256').update(normalizedUrl).digest('hex');

    return { normalizedUrl, urlHash };
  }
}

export interface ScraperAdapter {
  readonly sourceName: string;
  fetchArticles(targetUrl: string, selectorsJson?: any): Promise<ScrapedArticleResult[]>;
}

export class RssScraperAdapter implements ScraperAdapter {
  public readonly sourceName = 'RSS 2.0 / Atom Adapter';
  private parser = new RssParser();

  public async fetchArticles(targetUrl: string): Promise<ScrapedArticleResult[]> {
    const { buffer } = await SsrfValidator.fetchSecureBuffer(targetUrl);
    const xmlContent = buffer.toString('utf-8');

    const feed = await this.parser.parseString(xmlContent);
    const results: ScrapedArticleResult[] = [];

    for (const item of feed.items) {
      if (!item.link || !item.title) continue;

      const { normalizedUrl } = UrlNormalizer.normalize(item.link);
      results.push({
        externalId: item.guid || item.id,
        title: item.title.trim(),
        canonicalUrl: normalizedUrl,
        rawSummary: item.contentSnippet || item.summary,
        rawContent: item.content,
        author: item.creator,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        imageUrl: item.enclosure?.url,
        rawHtmlSnapshot: JSON.stringify(item),
      });

      if (results.length >= 10) break; // Chỉ lấy tối đa 10 bài viết mới nhất
    }

    return results;
  }
}

export class CheerioScraperAdapter implements ScraperAdapter {
  public readonly sourceName = 'HTML Cheerio Scraper';

  public async fetchArticles(targetUrl: string, selectorsJson?: any): Promise<ScrapedArticleResult[]> {
    const { buffer } = await SsrfValidator.fetchSecureBuffer(targetUrl);
    const htmlData = buffer.toString('utf-8');

    const $ = cheerio.load(htmlData);
    const results: ScrapedArticleResult[] = [];

    let containers = $(selectorsJson?.article || 'article, .art-item, .box-news, .news-item, .item-news, .cat-news-item');

    if (containers.length === 0) {
      containers = $('h1 a, h2 a, h3 a, h4 a, .title a, a[href*=".html"]').parent();
    }

    const seenUrls = new Set<string>();

    containers.each((_, el) => {
      if (results.length >= 10) return false; // Dừng lại khi đã bóc tách đủ 10 bài mới nhất

      let titleEl = $(el).find(selectorsJson?.title || 'h1 a, h2 a, h3 a, h4 a, p.title a, a.title, a');
      if (titleEl.length === 0 && $(el).is('a')) {
        titleEl = $(el);
      }

      const title = titleEl.text().trim();
      const rawHref = titleEl.attr('href') || $(el).find('a').attr('href');

      if (!title || !rawHref || title.length < 10) return;

      let fullUrl: string;
      try {
        fullUrl = rawHref.startsWith('http') ? rawHref : new URL(rawHref, targetUrl).toString();
      } catch {
        return;
      }

      const { normalizedUrl } = UrlNormalizer.normalize(fullUrl);
      if (seenUrls.has(normalizedUrl)) return;
      seenUrls.add(normalizedUrl);

      const rawSummary = $(el).find(selectorsJson?.summary || 'p.summary, .sapo, .lead, p').text().trim();
      const imgUrl = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');

      results.push({
        title,
        canonicalUrl: normalizedUrl,
        rawSummary,
        imageUrl: imgUrl ? (imgUrl.startsWith('http') ? imgUrl : new URL(imgUrl, targetUrl).toString()) : undefined,
        rawHtmlSnapshot: $(el).html() || '',
      });
    });

    return results;
  }
}
