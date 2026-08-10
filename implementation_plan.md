# THIẾT KẾ KIẾN TRÚC & KẾ HOẠCH TRIỂN KHAI PHÁT HÀNH TỰ ĐỘNG NỘI DUNG MULTI-PAGE FACEBOOK (SINGLE-VPS PRODUCTION TOPOLOGY)

> **Document Status:** Implementation Baseline Candidate (Pending Principal Review & Sign-off)  
> **Target Environment:** Single VPS (Ubuntu 24.04 LTS / 4-8 vCPU / 16GB RAM) + Docker Compose  
> **System Scope:** Automated News Collection, AI Transformation, Multi-Page Publishing, Human Review & Audit Infrastructure  
> **Security Level:** High (Enterprise Compliance, Zero-Trust Secret Encryption, SSRF & Prompt-Injection Hardened)

---

## 1. EXECUTIVE SUMMARY

Tài liệu này xác định kiến trúc kỹ thuật chi tiết cho hệ thống **FB-Publisher Enterprise**, một nền tảng quản trị nội dung tự động hóa end-to-end triển khai theo mô hình **Modular Monolith** trên hạ tầng **Single VPS kết hợp Docker Compose**. Hệ thống quản lý toàn bộ vòng đời nội dung: thu thập tin tức định kỳ từ các nguồn báo chí (RSS 2.0/Atom & HTML Scrape), chuẩn hóa và loại bỏ trùng lặp, biến đổi nội dung bằng Google Gemini AI (Structured Outputs), quản lý quy trình phê duyệt nghiêm ngặt (Human-in-the-loop) và phát hành đa kênh tới các Facebook Pages thông qua Meta Graph API.

Hệ thống được thiết kế theo tiêu chuẩn an toàn dữ liệu cao: áp dụng mô hình **Transactional Outbox**, quản lý trạng thái xuất bản nghi vấn (**`UNKNOWN`**) chặt chẽ, bảo vệ chống các tấn công SSRF/Prompt-Injection, và xây dựng quy trình khôi phục sự cố offsite cho PostgreSQL WAL, MinIO Object Storage và Encryption Master Keys.

---

## 2. GOALS

1. **Thu thập tin tức đa nguồn:** Hỗ trợ thu thập song song dữ liệu từ chuẩn RSS 2.0/Atom và cào cấu trúc HTML tĩnh/động với tần suất tùy chỉnh (tối thiểu 1 phút/lần).
2. **Chuẩn hóa & Chống trùng lặp tuyệt đối:** Loại bỏ trùng lặp tin tức theo nhiều tầng (Canonical URL, Domain Normalization, Content Hash/SimHash).
3. **AI Transformation an toàn:** Tích hợp Google Gemini API với JSON Schema cưỡng chế (Structured Outputs), tự động phân loại, kiểm duyệt an toàn nội dung, tóm tắt và sinh caption tiếng Việt theo văn phong mạng xã hội.
4. **Phê duyệt & Quản trị phiên bản (Immutable Revisions):** Cho phép người dùng xem trước, chỉnh sửa, duyệt hoặc từ chối bài viết. Mọi thao tác sửa đổi tạo ra phiên bản mới (`PostRevision`) và tự động vô hiệu hóa (`INVALIDATED`) các phê duyệt cũ.
5. **Phát hành Multi-Page tin cậy:** Đăng bài độc lập tới một hoặc nhiều Facebook Pages với trạng thái xử lý độc lập cho từng Page.
6. **Kiến trúc Transactional Outbox & Resilient Workers:** Đảm bảo tính toàn vẹn dữ liệu giữa PostgreSQL và Redis/BullMQ. Dữ liệu trạng thái xuất bản không bao giờ bị mất khi Redis bị crash hoặc `FLUSHALL`.
7. **Bảo mật cấp độ Ngân hàng:** Bảo vệ mã hóa Secret (AES-256-GCM Envelope Encryption), phòng chống triệt để SSRF (Server-Side Request Forgery) khi cào web/media, xác thực Mật khẩu cục bộ + TOTP MFA và kiểm soát truy cập theo vai trò (RBAC).

---

## 3. NON-GOALS

1. **Không hứa hẹn Exactly-Once Delivery với Meta Graph API:** Do bản chất phân tán của mạng internet và Meta API, hệ thống chỉ cam kết *At-Least-Once Delivery* trong phạm vi kết quả rõ ràng từ Meta Provider, kết hợp với cơ chế *Reconciliation Engine* để xử lý bài viết bị treo trạng thái `UNKNOWN`.
2. **Không tự động sáng tạo/chế bản hình ảnh bằng AI:** Hệ thống không cho phép AI tự phát minh URL ảnh hoặc sinh ảnh tự do không có nguồn gốc (Provenance).
3. **Không xử lý tự động 100% đối với nội dung nhạy cảm:** Hệ thống cấm tuyệt đối tính năng Auto-Publish đối với các chủ đề tai nạn, hình sự, tử vong, cáo buộc pháp lý, y tế và trẻ em.
4. **Không cam kết hạ tầng Kubernetes Multi-AZ hoặc HA 3-Node:** Do triển khai trên Single VPS, hệ thống loại bỏ các tuyên bố không có thực về zero-downtime datacenter failover.

---

## 4. ASSUMPTIONS VÀ CLOSED DECISIONS

### 4.1. Giả định (Assumptions)
- **G-01:** Doanh nghiệp sở hữu Facebook Business Account và quản lý tối thiểu 1 Facebook Page chính thức.
- **G-02:** Hệ thống vận hành trên 1 máy chủ VPS (Ubuntu 24.04 LTS, IP tĩnh), được backup định kỳ offsite sang nhà cung cấp lưu trữ độc lập (Cloud Storage S3/SFTP).
- **G-03:** Docker Compose quản lý các service: API Server, Worker Engine, Web Admin, PostgreSQL 16, Redis 7, MinIO.

### 4.2. Quyết định đã chốt (Closed Decisions)

| ID | Vấn đề | Giải pháp đã chọn | Lý do & Mô tả triển khai |
|---|---|---|---|
| **OD-01** | Hạ tầng & Topology | **Single VPS + Docker Compose** | Tối ưu chi phí, quản lý tập trung trên 1 VPS. Tất cả services đóng gói Docker container. |
| **OD-02** | Lưu trữ File Media | **MinIO S3 Self-hosted (Docker trên VPS)** | Chạy dưới dạng Docker container cùng VPS. Chuẩn giao thức S3 API, lưu trữ media đã kiểm duyệt và HTML snapshots. |
| **OD-03** | Quản lý Secret Production | **App-level Envelope Encryption (AES-256-GCM)** | Dùng Master Encryption Key từ biến môi trường VPS (`.env`) để mã hóa/giải mã Page Access Token / Gemini Key trong Node.js trước khi lưu DB. |
| **OD-04** | Phương thức Đăng ảnh Meta | **Upload nhị phân trực tiếp (`source` multipart)** | Stream trực tiếp file nhị phân từ MinIO VPS sang Meta Graph API, tránh lộ IP VPS và không sợ bị Meta block URL. |
| **OD-05** | Xác thực Người dùng | **Local Password (Argon2id/Bcrypt) + TOTP MFA** | Quản lý người dùng cục bộ, bắt buộc MFA cho `SUPER_ADMIN`, lưu trữ Session Cookie bảo mật HTTP-Only. |

---

## 5. CAPACITY ESTIMATES (TÍNH TOÁN NĂNG LỰC HỆ THỐNG TRÊN SINGLE VPS)

Dự toán dựa trên quy mô phát hành **10 Facebook Pages**, thu thập từ **20 nguồn báo**, tần suất quét 5 phút/lần trên Single VPS (8 vCPU / 16GB RAM).

| Hạng mục | Thông số / Công thức | Giá trị ước tính / Ngày |
|---|---|---|
| **Số lượt quét tin (Scrape Runs)** | 20 nguồn * (1440 phút / 5 phút) | 5,760 runs/ngày |
| **Số tin thô thu thập (Articles)** | 20 nguồn * 15 tin mới/ngày | 300 articles/ngày |
| **Số lượt gọi Gemini AI** | 300 articles * 1.2 retries | ~360 requests/ngày |
| **Số lượt đăng bài (Publications)** | 50 posts * 5 Pages target | 250 publications/ngày |
| **Dung lượng lưu trữ DB (Text)** | 300 articles * 10KB + 50 posts * 50KB | ~5.5 MB/ngày (~2 GB/năm) |
| **Băng thông Media Egress/Ingress** | 50 images * 2MB (Ingress + Egress) | ~200 MB/ngày (~73 GB/năm) |
| **Peak RAM Usage (Single VPS)** | PostgreSQL (4GB) + Redis (1GB) + MinIO (1GB) + Node Services (2GB) | ~8 GB / 16 GB Total RAM |

---

## 6. ARCHITECTURE VÀ TRUST BOUNDARIES

### 6.1. Sơ đồ Phân vùng Kiến trúc (Single VPS Topology)

```
[ EXTERNAL UNTRUSTED ZONE ]
  │
  ├─► Public Internet / News Sites (RSS/HTML)
  ├─► Meta Graph API (graph.facebook.com)
  └─► Google Gemini API (generativelanguage.googleapis.com)
  ▲
  │ (Reverse Proxy / NGINX / TLS Termination / WAF Rate Limit)
  ▼
[ SINGLE VPS DOCKER COMPOSE BOUNDARY ]
  │
  ├─► Container `web-admin` (Next.js App Router)
  ├─► Container `api-server` (Node.js Express Gateway)
  ├─► Container `worker-engine` (BullMQ Process & Outbox Dispatcher)
  ├─► Container `postgres-db` (PostgreSQL 16 Engine)
  ├─► Container `redis-queue` (Redis 7 Persistence AOF)
  └─► Container `minio-s3` (MinIO S3 Storage Engine)
  ▲
  │ (Offsite Cron Backup Process)
  ▼
[ OFFSITE BACKUP DESTINATION (AWS S3 / SFTP Remote) ]
  ├─► Encrypted PostgreSQL Base Backup + WAL Archives
  ├─► MinIO Bucket Volume Snapshot
  └─► Master Encryption Key Backup
```

---

## 7. MONOREPO / PACKAGE STRUCTURE

Hệ thống được tổ chức dưới dạng **pnpm Workspaces Monorepo**:

```text
fbpage-monorepo/
├── apps/
│   ├── web-admin/               # Next.js 14+ (App Router, Admin Dashboard, Server Actions)
│   ├── api-server/              # Node.js Express (REST API Gateway, Auth, Webhook Handlers)
│   └── worker-engine/           # Node.js Async Process (BullMQ Workers, Outbox Dispatcher)
├── packages/
│   ├── core-domain/             # Entities, State Machines, Domain Services, Repositories
│   ├── db-prisma/               # Prisma Schema, Migrations, Seeders, Audit Triggers
│   ├── scraper-adapters/        # Base Scraping Interface, RSS Adapter, Cheerio HTML Adapters
│   ├── ai-gemini/               # Gemini API SDK Client, Safety Rules, Prompt Templates, Schemas
│   ├── facebook-client/         # Meta Graph API Client, Rate Limiter, Retry Logic, Token Inspector
│   ├── media-processor/         # Image Download, SSRF Validator, Metadata Removal, MinIO Uploader
│   ├── secret-manager/          # Envelope Encryption (AES-256-GCM), Key Management
│   ├── logger-telemetry/        # Winston/Pino Logger, OpenTelemetry Tracing, Prometheus Metrics
│   └── shared-types/            # DTOs, Enums, JSON Schemas, Shared Constants
├── infra/
│   └── docker-compose.yml       # Production Docker Compose Configuration
├── pnpm-workspace.yaml
└── package.json
```

---

## 8. TECHNOLOGY VERSIONS VÀ VERSION POLICY

| Công nghệ / Thư viện | Phiên bản cố định (Fixed Version) | Chính sách Nâng cấp (Upgrade Policy) |
|---|---|---|
| **Node.js Runtime** | `20.16.0 LTS` | Cố định phiên bản LTS |
| **TypeScript** | `5.5.4` | Cố định minor version |
| **PostgreSQL** | `16.4` | Native JSONB & Transactional Advisory Locks |
| **Redis** | `7.2.5` | AOF Enabled (`appendfsync everysec`) |
| **Next.js** | `14.2.5` | App Router Architecture |
| **Prisma ORM** | `5.18.0` | Strict Typesafe Client |
| **BullMQ** | `5.12.0` | Idempotent Job Engine |
| **Meta Graph API** | `${META_GRAPH_API_VERSION}` (Default: `v20.0`) | **KHÔNG hardcode.** Khai báo qua Env Var `${META_GRAPH_API_VERSION}` |

---

## 9. COMPLETE DATABASE SCHEMA (STRICT PRISMA SPECIFICATION)

```prisma
// db-prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  SUPER_ADMIN
  EDITOR
  REVIEWER
  VIEWER
}

enum SourceType {
  RSS
  HTML_SCRAPE
}

enum SourceStatus {
  ACTIVE
  PAUSED
  ERROR_DISABLED
}

enum RunStatus {
  SUCCESS
  PARTIAL_SUCCESS
  FAILED
}

enum GenerationStatus {
  PENDING
  GENERATING
  GENERATED
  FAILED
}

enum ReviewStatus {
  DRAFT
  IN_REVIEW
  APPROVED
  REJECTED
  INVALIDATED
}

enum ApprovalAction {
  APPROVED
  REJECTED
  INVALIDATED
}

enum PublicationStatus {
  SCHEDULED
  QUEUED
  PUBLISHING
  PUBLISHED
  RETRY_WAIT
  UNKNOWN
  FAILED_PERMANENT
  CANCELLED
}

enum OutboxStatus {
  PENDING
  PROCESSING
  PROCESSED
  FAILED
}

enum RightsStatus {
  PUBLIC_DOMAIN
  CREATIVE_COMMONS
  FAIR_USE_NEWS
  REQUIRES_PERMISSION
  UNKNOWN
}

model User {
  id                        String       @id @default(uuid())
  email                     String       @unique
  passwordHash              String
  fullName                  String
  isMfaEnabled              Boolean      @default(false)
  mfaSecretEncrypted        String?
  mfaRecoveryCodesEncrypted String?
  version                   Int          @default(1)
  createdAt                 DateTime     @default(now())
  updatedAt                 DateTime     @updatedAt

  roles                     UserRole[]
  sessions                  Session[]
  approvals                 Approval[]
  auditEvents               AuditEvent[]

  @@map("users")
}

model UserRole {
  id        String   @id @default(uuid())
  userId    String
  role      Role
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, role])
  @@map("user_roles")
}

model Session {
  id           String    @id @default(uuid())
  userId       String
  tokenHash    String    @unique
  ipAddress    String
  userAgent    String
  expiresAt    DateTime
  revokedAt    DateTime?
  createdAt    DateTime  @default(now())

  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

model Source {
  id              String       @id @default(uuid())
  name            String
  url             String       @unique
  type            SourceType
  status          SourceStatus @default(ACTIVE)
  selectorsJson   Json?
  intervalMinutes Int          @default(5)
  failureCount    Int          @default(0)
  lastRunAt       DateTime?
  version         Int          @default(1)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  runs            SourceRun[]
  articles        Article[]

  @@map("sources")
}

model SourceRun {
  id           String    @id @default(uuid())
  sourceId     String
  status       RunStatus
  itemCount    Int       @default(0)
  errorMessage String?
  executedAt   DateTime  @default(now())

  source       Source    @relation(fields: [sourceId], references: [id], onDelete: Cascade)

  @@index([sourceId, executedAt])
  @@map("source_runs")
}

model Article {
  id             String   @id @default(uuid())
  sourceId       String
  externalId     String?  // GUID từ RSS hoặc HTML ID
  canonicalUrl   String   @unique
  urlHash        String   @unique // SHA-256(canonicalUrl)
  title          String
  rawSummary     String?
  rawContent     String?  @db.Text
  author         String?
  publishedAt    DateTime?
  fetchedAt      DateTime @default(now())
  version        Int      @default(1)

  source         Source   @relation(fields: [sourceId], references: [id])
  snapshots      ExtractionMetadata[]
  posts          Post[]

  @@unique([sourceId, externalId])
  @@index([sourceId])
  @@index([fetchedAt])
  @@map("articles")
}

model ExtractionMetadata {
  id          String    @id @default(uuid())
  articleId   String
  storagePath String?   // MinIO object key lưu raw html
  rawHtmlHash String
  httpStatus  Int
  headersJson Json
  expiresAt   DateTime? // TTL xóa snapshot HTML
  extractedAt DateTime  @default(now())

  article     Article   @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@index([articleId])
  @@map("extraction_metadata")
}

model PromptVersion {
  id             String   @id @default(uuid())
  version        Int      @unique
  promptTemplate String   @db.Text
  jsonSchema     Json
  modelName      String   // e.g. gemini-1.5-flash / gemini-1.5-pro
  isActive       Boolean  @default(false)
  createdAt      DateTime @default(now())

  posts          Post[]

  @@map("prompt_versions")
}

model Post {
  id                    String           @id @default(uuid())
  articleId             String
  promptVersionId       String
  generationStatus      GenerationStatus @default(PENDING)
  reviewStatus          ReviewStatus     @default(DRAFT)
  currentRevisionId     String?          @unique
  isAutoPublishEligible Boolean          @default(false)
  sensitivityFlag       Boolean          @default(false)
  version               Int              @default(1)
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt

  article               Article          @relation(fields: [articleId], references: [id])
  promptVersion         PromptVersion    @relation(fields: [promptVersionId], references: [id])
  currentRevision       PostRevision?    @relation("CurrentPostRevision", fields: [currentRevisionId], references: [id])
  revisions             PostRevision[]   @relation("AllPostRevisions")
  publications          Publication[]

  @@index([articleId])
  @@index([reviewStatus])
  @@map("posts")
}

model PostRevision {
  id               String       @id @default(uuid())
  postId           String
  revisionNumber   Int
  caption          String       @db.Text
  mediaAssetId     String?
  inputHash        String       // SHA-256(input article + prompt)
  aiResponseRaw    Json?
  aiSafetyResult   Json?
  inputTokenCount  Int          @default(0)
  outputTokenCount Int          @default(0)
  estimatedCostUsd Decimal      @db.Decimal(10, 6) @default(0)
  createdAt        DateTime     @default(now())

  post             Post         @relation("AllPostRevisions", fields: [postId], references: [id], onDelete: Cascade)
  postForCurrent   Post?        @relation("CurrentPostRevision")
  mediaAsset       MediaAsset?  @relation(fields: [mediaAssetId], references: [id])
  approvals        Approval[]
  publications     Publication[]

  @@unique([postId, revisionNumber])
  @@index([postId])
  @@map("post_revisions")
}

model MediaAsset {
  id            String       @id @default(uuid())
  originalUrl   String
  storagePath   String       // Path trên MinIO S3
  sha256Hash    String       @unique
  mimeType      String
  fileSizeBytes Int
  width         Int?
  height        Int?
  rightsStatus  RightsStatus @default(UNKNOWN)
  isApproved    Boolean      @default(false) // Mặc định FALSE
  createdAt     DateTime     @default(now())

  postRevisions PostRevision[]

  @@map("media_assets")
}

model Approval {
  id             String         @id @default(uuid())
  postRevisionId String
  userId         String
  action         ApprovalAction
  note           String?
  createdAt      DateTime       @default(now())

  postRevision   PostRevision   @relation(fields: [postRevisionId], references: [id], onDelete: Cascade)
  user           User           @relation(fields: [userId], references: [id])

  @@index([postRevisionId])
  @@map("approvals")
}

model FacebookPage {
  id                   String   @id @default(uuid())
  pageId               String   @unique // Meta Page ID
  name                 String
  encryptedAccessToken String   @db.Text // Encrypted via AES-256-GCM
  tokenExpiresAt       DateTime?
  isValid              Boolean  @default(true)
  version              Int      @default(1)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  publications         Publication[]

  @@map("facebook_pages")
}

model Publication {
  id                 String            @id @default(uuid())
  postId             String
  postRevisionId     String
  facebookPageId     String
  status             PublicationStatus @default(SCHEDULED)
  scheduledAt        DateTime
  publishedAt        DateTime?
  fbPostId           String?           // Form: {page_id}_{post_id}
  idempotencyKey     String            @unique // SHA-256(postId + revisionId + pageId + scheduledAt)
  leaseOwner         String?           // Worker instance ID
  leaseExpiresAt     DateTime?
  lastHeartbeatAt    DateTime?
  requestStartedAt   DateTime?
  requestCompletedAt DateTime?
  version            Int               @default(1)
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  post               Post              @relation(fields: [postId], references: [id])
  postRevision       PostRevision      @relation(fields: [postRevisionId], references: [id])
  facebookPage       FacebookPage      @relation(fields: [facebookPageId], references: [id])
  attempts           PublicationAttempt[]

  @@unique([facebookPageId, fbPostId])
  @@index([status, scheduledAt])
  @@index([postId])
  @@index([postRevisionId])
  @@map("publications")
}

model PublicationAttempt {
  id             String            @id @default(uuid())
  publicationId  String
  attemptNumber  Int
  status         PublicationStatus
  httpStatusCode Int?
  errorCode      Int?
  errorMessage   String?           @db.Text
  rawResponse    Json?
  executedAt     DateTime          @default(now())

  publication    Publication       @relation(fields: [publicationId], references: [id], onDelete: Cascade)

  @@unique([publicationId, attemptNumber])
  @@index([publicationId])
  @@map("publication_attempts")
}

model OutboxEvent {
  id             String       @id @default(uuid())
  dedupeKey      String       @unique // SHA-256(aggregateType + aggregateId + eventType + payload)
  aggregateType  String       // e.g. "PUBLICATION"
  aggregateId    String       // e.g. publicationId
  eventType      String       // e.g. "PUBLICATION_QUEUED"
  payloadJson    Json
  status         OutboxStatus @default(PENDING)
  lockedBy       String?
  lockedAt       DateTime?
  leaseExpiresAt DateTime?
  retryCount     Int          @default(0)
  scheduledAt    DateTime     @default(now())
  processedAt    DateTime?
  errorMessage   String?

  @@index([status, scheduledAt])
  @@map("outbox_events")
}

model AuditEvent {
  id           String   @id @default(uuid())
  userId       String?
  action       String   // e.g. "RECONCILE_UNKNOWN_POST", "UPDATE_SECRET"
  resourceType String
  resourceId   String?
  ipAddress    String
  userAgent    String
  payloadBefore Json?
  payloadAfter  Json?
  createdAt    DateTime @default(now())

  user         User?    @relation(fields: [userId], references: [id])

  @@index([createdAt])
  @@index([userId])
  @@map("audit_events")
}

model AppSetting {
  id                  String   @id @default(uuid())
  key                 String   @unique
  encryptedValue      String?  @db.Text
  plainValue          String?  @db.Text
  isSecret            Boolean  @default(false)
  updatedByUserId     String?
  version             Int      @default(1)
  updatedAt           DateTime @updatedAt

  @@map("app_settings")
}
```

---

## 10. CONSTRAINTS, INDEXES, NULLABILITY VÀ RETENTION

### 10.1. Ràng buộc & Chỉ mục quan trọng (Indexes & Constraints)
- **`Article.urlHash` & `Article(sourceId, externalId)`**: Unique Indexes ngăn trùng bài báo.
- **`Publication.idempotencyKey`**: UNIQUE Index (`SHA-256(postId + postRevisionId + facebookPageId + scheduledAt)`).
- **`Publication(facebookPageId, fbPostId)`**: Unique Index bảo đảm 1 Facebook Post ID chỉ gắn với 1 publication duy nhất trên Page đó.
- **`OutboxEvent.dedupeKey`**: Unique Index ngăn trùng lặp Event.

### 10.2. Retention Policy cho Single VPS

| Dữ liệu | Thời hạn lưu (TTL) | Cơ chế xử lý |
|---|---|---|
| **Article Records** | Giữ vĩnh viễn (Long-term Identity) | Không bao giờ xóa Article để duy trì FK provenance với Post |
| **Raw HTML Snapshots** | 30 Ngày | Xóa file HTML snapshot trên MinIO S3, giữ lại `Article` record |
| **Outbox Events (`PROCESSED`)** | 7 Ngày | Job Cron dọn dẹp các sự kiện Outbox đã hoàn thành |
| **Audit Logs** | 1 Năm | Lưu trong DB PostgreSQL + Export định kỳ file JSON mã hóa offsite |

---

## 11. GENERATION / REVIEW / PUBLICATION STATE MACHINES

```
[ GENERATION STATE ]
  PENDING ──► GENERATING ──► GENERATED
                    │
                    └──► FAILED

[ REVIEW STATE ]
  DRAFT ──► IN_REVIEW ──► APPROVED
               │               │
               ▼               ▼ (Khi tạo Revision mới -> Chuyển INVALIDATED)
            REJECTED        INVALIDATED (Người dùng phải duyệt lại)

[ PUBLICATION STATE (Mỗi Facebook Page có 1 Instance riêng) ]

  SCHEDULED ──► QUEUED ──► PUBLISHING ──► PUBLISHED ◄──┐
                  │            │                       │
                  │            ├──► RETRY_WAIT ────────┤ (Reconciliation xác nhận)
                  │            │       │               │
                  │            │       ▼               │
                  │            ├──► UNKNOWN ───────────┘
                  │            │       │
                  │            │       ▼ (Reconciliation xác nhận chưa lên)
                  │            └──► FAILED_PERMANENT
                  │
                  └────────────────► CANCELLED
```

---

## 12. END-TO-END WORKFLOWS

1. **Scrape Job:** Worker cào tin -> Validate SSRF -> Kiểm tra `urlHash` -> Lưu `Article` & `ExtractionMetadata`.
2. **AI Job:** Trigger Gemini API -> Format Structured JSON -> Tạo `Post` & `PostRevision` (Mặc định `ReviewStatus.DRAFT`).
3. **Review & Approval:** Người dùng xem trên Admin UI -> Bấm **Approve** -> Tạo bản ghi `Approval(action: APPROVED)`.
4. **Publishing Job:** Tạo Outbox Event -> Dispatcher đẩy vào BullMQ (`jobId = outboxEvent.id`) -> Worker lock Lease -> Gửi Meta Graph API -> Cập nhật trạng thái `PUBLISHED` hoặc `UNKNOWN`.

---

## 13. TRANSACTIONAL OUTBOX ALGORITHM VÀ RECOVERY

Toàn bộ thao tác enqueue phải qua PostgreSQL Transactional Outbox:

```typescript
// Core Outbox Algorithm
async function enqueueOutboxEvent(tx: PrismaTransaction, aggregateType: string, aggregateId: string, eventType: string, payload: any) {
  const dedupeKey = crypto.createHash('sha256')
    .update(`${aggregateType}:${aggregateId}:${eventType}:${JSON.stringify(payload)}`)
    .digest('hex');

  return tx.outboxEvent.create({
    data: {
      dedupeKey,
      aggregateType,
      aggregateId,
      eventType,
      payloadJson: payload,
      status: 'PENDING'
    }
  });
}
```

### Quy trình Recovery khi Redis bị crash hoặc `FLUSHALL`:
1. **Redis KHÔNG ĐƯỢC COI LÀ SOURCES OF TRUTH.**
2. Sau khi Redis khởi động lại, **DB Outbox Reconciler Process** sẽ tìm tất cả `OutboxEvent` có `status = PENDING` hoặc `PROCESSING` (hết lease) -> Đẩy lại vào BullMQ với `jobId = outboxEvent.id`.
3. Nhờ `jobId` cố định, BullMQ tự động loại bỏ các Job bị lặp lại.

---

## 14. QUEUE TOPOLOGY VÀ RETRY MATRIX

### 14.1. Phân loại Lỗi Xuất bản (Error Taxonomy)

| Phân loại Lỗi | Bản chất & Ví dụ | Hành động | Trạng thái Chuyển |
|---|---|---|---|
| **Pre-send Error** | Payload không hợp lệ, Token mã hóa sai, Media chưa duyệt | Stop ngay, báo lỗi | `FAILED_PERMANENT` |
| **Definitive Rejection** | Meta trả về `HTTP 400/403`, Token Revoked (`Code 190`), Invalid Permissions | Stop ngay, báo Alert Admin | `FAILED_PERMANENT` |
| **Rate Limit (Transient)** | Meta Error Code `4`, `17`, `32` (BUC Limit Exceeded) | Backoff (5m, 15m, 45m) | `RETRY_WAIT` |
| **Server Error 5xx (Deterministic)**| Meta HTTP 500/502/503 (Có Response body xác nhận chưa lưu) | Retries 3 lần (1m, 3m, 5m) | `RETRY_WAIT` |
| **Ambiguous Post-Send Error** | Timeout > 30s, Socket Hangup, ETIMEDOUT trong lúc chờ response `POST` | **CẤM RETRY TỰ ĐỘNG** | **`UNKNOWN`** |

---

## 15. SCRAPER ADAPTER CONTRACT

```typescript
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

export interface ScraperAdapter {
  readonly sourceName: string;
  supports(url: string): boolean;
  fetchLatestArticles(sourceConfig: Source): Promise<ScrapedArticleResult[]>;
}
```

---

## 16. URL NORMALIZATION VÀ DEDUPLICATION

1. Chuyển hostname về lowercase.
2. Loại bỏ các URL tracking parameters (`utm_*`, `fbclid`, `gclid`, `ref`).
3. Sort lại query parameters còn lại theo thứ tự Alphabet.
4. Loại bỏ Fragment Identifier (`#...`).
5. Tính `urlHash = SHA-256(normalizedUrl)`.

---

## 17. GEMINI INTEGRATION VÀ SAFETY POLICY

- **Model:** `gemini-1.5-flash` / `gemini-1.5-pro` (Dùng SDK `@google/genai`).
- **Temperature:** `0.2` (Chống bịa đặt thông tin).
- **Structured JSON Schema:**
```json
{
  "type": "object",
  "properties": {
    "is_relevant": { "type": "boolean" },
    "category": { "type": "string" },
    "facebook_caption": { "type": "string" },
    "sensitivity_flag": { "type": "boolean" }
  },
  "required": ["is_relevant", "category", "facebook_caption", "sensitivity_flag"]
}
```
- **Prompt Injection Defense:** Dữ liệu bài viết gốc bọc trong `<article_input>...</article_input>`. System prompt cấm Gemini thi hành câu lệnh ẩn bên trong input.

---

## 18. MEDIA PIPELINE & SSRF PROTECTION

- **Scheme Validation:** Chỉ cho phép `https://`.
- **DNS Pinning & IP Filtering:** Chặn dải IP nội bộ (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`).
- **Magic Bytes Inspection:** Kiểm tra byte đầu (JPEG: `0xFFD8FF`, PNG: `0x89504E47`).
- **Rights & Approval:** `MediaAsset.isApproved` **mặc định là `FALSE`**. Bài viết chỉ được phép phát hành khi MediaAsset đã được phê duyệt.

---

## 19. FACEBOOK OAUTH / TOKEN LIFECYCLE

- **Chính sách Token:** Không có Token nào là "Never-Expiring" tuyệt đối. Page Access Token có thể bị thu hồi khi đổi mật khẩu, gỡ App, hoặc hết hạn User Session.
- **Authorization Header:** Mọi HTTP Request gọi Meta API BẮT BUỘC truyền Token qua Header: `Authorization: Bearer {decrypted_token}`. Cấm truyền token trên Query String.
- **Security Proof (`appsecret_proof`):**  
  Mọi cuộc gọi Graph API bắt buộc kèm tham số `appsecret_proof = HMAC-SHA256(page_access_token, meta_app_secret)`.

---

## 20. FACEBOOK PUBLISHING CONTRACTS

### Đăng bài kèm Ảnh Nhị phân Trực tiếp (`POST /${META_GRAPH_API_VERSION}/{page-id}/photos`)
```http
POST /${META_GRAPH_API_VERSION}/{page-id}/photos HTTP/1.1
Host: graph.facebook.com
Authorization: Bearer {decrypted_page_access_token}
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="caption"

Nội dung mô tả bài viết...
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="appsecret_proof"

{calculated_hmac_sha256}
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="source"; filename="image.jpg"
Content-Type: image/jpeg

<Binary Stream từ MinIO>
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

---

## 21. UNKNOWN STATE RECONCILIATION

### Cơ chế Reconciliation kiểm tra bài `UNKNOWN`:
1. Khi bài viết ở trạng thái `UNKNOWN`, Reconciliation Job sẽ gọi `GET /${META_GRAPH_API_VERSION}/{page-id}/feed?fields=id,message,link,created_time`.
2. Kiểm tra danh sách bài trên Page trong khoảng thời gian `[requestStartedAt - 5m, NOW]`:
   - So sánh Hash tiêu đề / Caption.
   - So sánh Link nguồn bài báo.
3. **Kết quả:**
   - Nếu tìm thấy bài trùng khớp trên Facebook -> Cập nhật `status = PUBLISHED` & lưu `fbPostId`.
   - Nếu KHÔNG tìm thấy sau 3 lần Reconciliation -> Cập nhật `status = FAILED_PERMANENT`.
   - Nếu không đủ bằng chứng rõ ràng -> **GIỮ NGUYÊN `UNKNOWN`**.
4. **Quyền Operator:** Chỉ người dùng vai trò `SUPER_ADMIN` mới có quyền chuyển `UNKNOWN` -> `QUEUED` trên Admin UI, đi kèm hộp thoại cảnh báo nguy cơ đăng lặp bài và lưu vết Audit Log.

---

## 22. META RATE-LIMIT HANDLING

Hệ thống bóc tách chính xác 2 loại Response Header từ Meta:
- **`X-App-Usage`**: `{"call_count": 80, "total_cputime": 50, "total_time": 60}`
- **`X-Business-Use-Case-Usage`**: `{"{page_id}": [{"type": "pages", "call_count": 85, "total_cputime": 70, "total_time": 75, "estimated_time_to_regain_access": 15}]}`

**Quy tắc:** Khi bất kỳ chỉ số `total_cputime` hoặc `call_count` vượt quá **85%**, hoặc xuất hiện `estimated_time_to_regain_access`, Worker tự động tạm dừng gửi bài tới Page đó trong thời gian tương ứng.

---

## 23. WEBHOOKS VÀ SIGNATURE VERIFICATION

### 23.1. GET Verification (`GET /api/v1/webhooks/facebook`)
```typescript
app.get('/api/v1/webhooks/facebook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});
```

### 23.2. POST Event & Timing-Safe Verification
```typescript
const signature = req.headers['x-hub-signature-256'] as string;
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', process.env.META_APP_SECRET!)
  .update(rawBody)
  .digest('hex');

if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
  throw new UnauthorizedException('Invalid Webhook Signature');
}
```

---

## 24. BACKEND API CONTRACTS (FULL SPECIFICATION)

| Method | Endpoint | Role | Idempotency | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | No | Đăng nhập Mật khẩu + TOTP MFA |
| `POST` | `/api/v1/auth/logout` | Authenticated | No | Hủy Session Cookie hiện tại |
| `GET` | `/api/v1/sources` | All Roles | No | Danh sách Nguồn Báo |
| `POST` | `/api/v1/sources` | `SUPER_ADMIN` | Yes | Thêm Nguồn Báo mới |
| `POST` | `/api/v1/sources/{id}/test` | `SUPER_ADMIN` | No | Test cào tin thử từ nguồn |
| `GET` | `/api/v1/posts` | All Roles | No | Danh sách Bài viết & Lọc theo Trạng thái |
| `POST` | `/api/v1/posts/{id}/revisions` | `EDITOR`, `SUPER_ADMIN` | Yes | Tạo Revision sửa Caption/Media |
| `POST` | `/api/v1/posts/{id}/approve` | `REVIEWER`, `SUPER_ADMIN` | Yes | Phê duyệt Bài viết (`ReviewStatus.APPROVED`) |
| `POST` | `/api/v1/publications/{id}/reconcile` | `SUPER_ADMIN` | Yes (Audit Log) | Xử lý thủ công bài viết `UNKNOWN` |
| `GET` | `/health/liveness` | Public | No | Liveness Probe (HTTP 200) |
| `GET` | `/health/readiness` | Public | No | Readiness Probe (DB & Redis Check) |

---

## 25. AUTHENTICATION & SESSION SECURITY

- **Cơ chế Xác thực:** Local Password (`Argon2id` / `Bcrypt`) + TOTP MFA (Authenticator App).
- **Session Management:** Lưu Session trong DB table `sessions`. Cookie chứa Session ID được mã hóa, cài thuộc tính `HttpOnly`, `Secure`, `SameSite=Strict`.
- **MFA Recovery:** Sinh 8 mã Khôi phục (Recovery Codes) mã hóa lưu trong DB khi người dùng bật MFA.

---

## 26. AUDIT LOGGING

Mọi thao tác thay đổi dữ liệu nhạy cảm (Duyệt bài, Sửa secret, Reconcile `UNKNOWN`) phải ghi bản ghi Append-Only vào `audit_events`:

```json
{
  "id": "audit-uuid-1234",
  "userId": "user-uuid-5678",
  "action": "RECONCILE_UNKNOWN_PUBLICATION",
  "resourceType": "PUBLICATION",
  "resourceId": "pub-uuid-9999",
  "ipAddress": "113.161.x.x",
  "payloadBefore": { "status": "UNKNOWN" },
  "payloadAfter": { "status": "QUEUED" },
  "createdAt": "2026-08-06T21:00:00.000Z"
}
```

---

## 27. OBSERVABILITY & SLO (DÀNH CHO SINGLE VPS)

- **SLO Latency Scrape-to-Draft:** 90% bài viết mới từ nguồn báo chuyển thành Draft trong vòng **< 10 phút** (Tính từ mốc tin xuất hiện ở nguồn báo + 5 phút interval quét).
- **SLO Publication Processing:** 98% tác vụ phát hành hợp lệ hoàn thành đúng thời gian hẹn (± 1 phút), loại trừ khoảng thời gian Meta bị ngưng trệ (Outage) hoặc bị Rate Limit.
- **SLA Emergency Delete:** Thực hiện xóa khẩn cấp bài viết trên Facebook trong vòng **< 5 phút** kể từ khi Operator bấm nút Takedown trên Admin UI.

---

## 28. OPERATIONAL RUNBOOKS (KỊCH BẢN XỬ LÝ SỰ CỐ)

### 28.1. Runbook-01: Redis Crash hoặc Mất Dữ liệu
1. Khởi động lại Container Redis (`docker compose restart redis-queue`).
2. Chạy Script Reconcile Outbox trong CLI: `pnpm --filter worker-engine outbox:reconcile`.
3. Hệ thống quét toàn bộ `outbox_events` có `status = PENDING` và nạp lại vào Redis BullMQ.

### 28.2. Runbook-02: Xử lý Bài viết Trạng thái `UNKNOWN`
1. Mở Admin UI -> Vào trang **Khôi phục Xuất bản (Publications UNKNOWN)**.
2. Bấm nút **"Kiểm tra Tự động (Auto Reconcile)"** để hệ thống gọi Meta API đối soát.
3. Nếu bài chưa lên Facebook và chắc chắn an toàn -> `SUPER_ADMIN` bấm **"Cấp phép Đăng lại (Force Re-queue)"** (Điền lý do vào hộp thoại Audit Log).

### 28.3. Runbook-03: Lộ Master Encryption Key
1. Tạo Master Key mới (`NEW_MASTER_KEY`).
2. Chạy lệnh Re-encrypt CLI: `pnpm --filter secret-manager reencrypt --old-key=... --new-key=...`.
3. Cập nhật file `.env` trên VPS và khởi động lại Docker Compose.

---

## 29. LEGAL VÀ COMPLIANCE CHECKLIST

- [ ] **robots.txt Policy Compliance:** Đã kiểm tra và lưu vết log robots.txt trước khi cào tin.
- [ ] **Attribution Link:** Mọi bài đăng Facebook bắt buộc kèm đường dẫn Nguồn bài gốc.
- [ ] **Image Reuse Rights:** Ảnh cào về mặc định có `rightsStatus = UNKNOWN` và `isApproved = FALSE`. Người dùng phải kiểm tra bản quyền trước khi duyệt phát hành.

---

## 30. ACCEPTANCE CRITERIA ĐỊNH LƯỢNG

| ID | Tiêu chí Nghiệm thu | Chỉ số Định lượng Bắt buộc | Phương pháp Kiểm tra |
|---|---|---|---|
| **AC-01** | Kiểm soát Đăng lặp | 0% bài bị đăng lặp trong điều kiện Meta trả về response rõ ràng | Integration Test Replay Job |
| **AC-02** | Phôi phục Outbox | 100% Outbox PENDING được nạp lại sau khi `FLUSHALL` Redis | Fault Injection Test trên Redis |
| **AC-03** | Bảo mật Secret | 0 Plaintext Access Token/Key xuất hiện trong Log hoặc DB Output | Static Log Scan |
| **AC-04** | Chống Tấn công SSRF | 100% Request tới IP nội bộ / Metadata IP bị chặn | Security Automated Suite |
| **AC-05** | Khóa UNKNOWN Retry | 0% bài `UNKNOWN` tự động đăng lại mà không qua Reconcile/Admin | Worker Core Logic Unit Test |

---

## 31. PRINCIPAL APPROVAL CHECKLIST (DÁNH CHO VÒNG REVIEW TIẾP THEO)

- [ ] **[ ]** Chủ dự án xác nhận danh sách nguồn báo ban đầu và chạy thử Scraper trên VPS.
- [ ] **[ ]** Hoàn tất chạy thử nghiệm Meta App trên môi trường Staging với 1 Facebook Page Test.
- [ ] **[ ]** Đạt 100% Pass cho Suite Security Test (SSRF & Secret Leak Scan).
- [ ] **[ ]** Thực hiện thành công bài diễn tập khôi phục offsite PostgreSQL Backup & MinIO Volume.

---

> **Tài liệu hiện đạt trạng thái "Implementation Baseline Candidate". Cần chữ ký xác nhận của Principal Reviewer trước khi tiến hành viết code Production.**
