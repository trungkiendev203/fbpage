export interface ScrapedArticleResult {
  externalId?: string;
  title: string;
  canonicalUrl: string;
  rawSummary?: string;
  rawContent?: string;
  author?: string;
  publishedAt?: Date;
  imageUrl?: string;
  rawHtmlSnapshot: string;
}

export interface AiRewriteResult {
  is_relevant: boolean;
  category: string;
  facebook_caption: string;
  sensitivity_flag: boolean;
  suggested_hashtags?: string[];
}

export interface FacebookPostPayload {
  caption: string;
  mediaBuffer?: Buffer;
  mimeType?: string;
  linkUrl?: string;
}

export interface MetaAppUsageHeader {
  call_count: number;
  total_cputime: number;
  total_time: number;
  estimated_time_to_regain_access?: number;
}

export * from './state-machine';

