export type ReviewStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'INVALIDATED';

export type PublicationStatus =
  | 'SCHEDULED'
  | 'QUEUED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'RETRY_WAIT'
  | 'UNKNOWN'
  | 'FAILED_PERMANENT'
  | 'CANCELLED';

export type SourceStatus = 'ACTIVE' | 'PAUSED' | 'ERROR_DISABLED';

export interface UserRole {
  role: 'SUPER_ADMIN' | 'EDITOR' | 'REVIEWER' | 'VIEWER';
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole['role'][];
}

export interface Article {
  id: string;
  title: string;
  canonicalUrl: string;
  rawSummary?: string;
  rawContent?: string;
  author?: string;
  publishedAt: string;
  imageUrl?: string;
  sourceName?: string;
}

export interface PostRevision {
  id: string;
  postId: string;
  revisionNumber: number;
  caption: string;
  createdAt: string;
  mediaAssetUrl?: string;
}

export interface FacebookPage {
  id: string;
  pageId: string;
  name: string;
  isValid: boolean;
  tokenExpiresAt?: string;
}

export interface PublicationAttempt {
  id: string;
  attemptNumber: number;
  status: PublicationStatus;
  httpStatusCode?: number;
  errorCode?: string;
  errorMessage?: string;
  requestStartedAt?: string;
  requestCompletedAt?: string;
  rawResponse?: any;
  createdAt: string;
}

export interface Publication {
  id: string;
  postId: string;
  facebookPageId: string;
  status: PublicationStatus;
  scheduledAt: string;
  publishedAt?: string;
  fbPostId?: string;
  postRevisionId: string;
  post?: any;
  postRevision?: PostRevision;
  facebookPage?: FacebookPage;
  attempts?: PublicationAttempt[];
  updatedAt: string;
}

export interface ReviewItem {
  id: string;
  articleId: string;
  article: Article;
  currentRevision: PostRevision;
  reviewStatus: ReviewStatus;
  generationStatus: 'GENERATED' | 'FAILED';
  sensitivityFlag: boolean;
  isAutoPublishEligible: boolean;
  createdAt: string;
  revisions?: PostRevision[];
  approvalHistory?: {
    action: string;
    userName: string;
    timestamp: string;
    note?: string;
  }[];
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: 'RSS' | 'HTML_SCRAPE';
  status: SourceStatus;
  intervalMinutes: number;
  healthScore: number;
  lastRunAt?: string;
  nextRunAt?: string;
  scrapedCount: number;
  errorRatePercent: number;
}
