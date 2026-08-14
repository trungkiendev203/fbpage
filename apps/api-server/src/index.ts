import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { PrismaClient, Role } from 'db-prisma';
import { SecretManager } from 'secret-manager';
import { MetaGraphApiClient } from 'facebook-client';
import { RssScraperAdapter, CheerioScraperAdapter } from 'scraper-adapters';
import { GeminiRewriterService } from 'ai-gemini';

import { authenticateUser, AuthenticatedRequest } from './middleware/auth';
import { requireRole } from './middleware/rbac';
import { csrfProtection } from './middleware/csrf';
import { sanitizePost, sanitizeUser, sanitizePublication } from './utils/dto';

const app = express();
const prisma = new PrismaClient();
const secretManager = new SecretManager();
const facebookClient = new MetaGraphApiClient();

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,https://toolsfb.quynhanhbeauty.online').split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        ALLOWED_ORIGINS.includes(origin) ||
        ALLOWED_ORIGINS.includes('*') ||
        process.env.NODE_ENV !== 'production'
      ) {
        callback(null, true);
      } else {
        callback(null, origin);
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Health Check Probes
app.get('/health/liveness', (_req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

app.get('/health/readiness', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'READY', db: 'CONNECTED' });
  } catch (error) {
    res.status(503).json({ status: 'UNHEALTHY', db: 'DISCONNECTED' });
  }
});

// Facebook Webhook Verification GET
app.get('/api/v1/webhooks/facebook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'verify_token_123';

  if (mode === 'subscribe' && token === expectedToken) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Facebook Webhook Listener POST
app.post('/api/v1/webhooks/facebook', (req: any, res) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const appSecret = process.env.META_APP_SECRET || '';

  if (!signature || !appSecret || !req.rawBody) {
    return res.status(401).json({ error: 'Missing Webhook Signature or App Secret' });
  }

  const expectedSignature =
    'sha256=' + crypto.createHmac('sha256', appSecret).update(req.rawBody).digest('hex');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return res.status(401).json({ error: 'Invalid Webhook Signature' });
  }

  res.status(200).json({ status: 'EVENT_RECEIVED' });
});

// Auth Routes
app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: true },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
  }

  const rawSessionToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');
  const csrfToken = crypto.randomBytes(16).toString('hex');

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Unknown',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  res.cookie('session_token', rawSessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.cookie('csrf_token', csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({
    user: sanitizeUser({
      ...user,
      roles: user.roles.map((r: any) => r.role),
    }),
    csrfToken,
  });
});

app.post('/api/v1/auth/logout', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  if (req.session?.id) {
    await prisma.session.update({
      where: { id: req.session.id },
      data: { revokedAt: new Date() },
    });
  }

  res.clearCookie('session_token');
  res.clearCookie('csrf_token');
  res.json({ success: true });
});

app.get('/api/v1/auth/me', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  let csrfToken = req.cookies?.['csrf_token'];
  if (!csrfToken) {
    csrfToken = crypto.randomBytes(16).toString('hex');
    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
  res.json({ user: req.user, csrfToken });
});

// Sources API Endpoints
app.get('/api/v1/sources', authenticateUser, async (_req, res) => {
  const sources = await prisma.source.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: sources });
});

app.post('/api/v1/sources', authenticateUser, csrfProtection, async (req: Request, res: Response) => {
  const { name, url, type, intervalMinutes } = req.body;
  if (!name || !url || !type) {
    return res.status(400).json({ error: 'Name, URL, and type are required' });
  }

  try {
    const source = await prisma.source.upsert({
      where: { url },
      update: {
        name,
        type: type === 'RSS' ? 'RSS' : 'HTML_SCRAPE',
        intervalMinutes: intervalMinutes || 5,
        status: 'ACTIVE',
      },
      create: {
        name,
        url,
        type: type === 'RSS' ? 'RSS' : 'HTML_SCRAPE',
        intervalMinutes: intervalMinutes || 5,
        status: 'ACTIVE',
      },
    });
    res.json({ data: source, message: 'Cập nhật/Thêm nguồn quét tin thành công!' });
  } catch (err: any) {
    res.status(400).json({ error: 'FAILED_TO_SAVE_SOURCE', message: 'Lỗi khi lưu nguồn tin: ' + (err.message || 'Không hợp lệ') });
  }
});

app.delete('/api/v1/sources/:id', authenticateUser, csrfProtection, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.$transaction(async (tx: any) => {
      const articles = await tx.article.findMany({ where: { sourceId: id }, select: { id: true } });
      const articleIds = articles.map((a: any) => a.id);

      if (articleIds.length > 0) {
        const posts = await tx.post.findMany({ where: { articleId: { in: articleIds } }, select: { id: true } });
        const postIds = posts.map((p: any) => p.id);

        if (postIds.length > 0) {
          await tx.publicationAttempt.deleteMany({ where: { publication: { postId: { in: postIds } } } });
          await tx.publication.deleteMany({ where: { postId: { in: postIds } } });
          await tx.postRevision.deleteMany({ where: { postId: { in: postIds } } });
          await tx.post.deleteMany({ where: { id: { in: postIds } } });
        }

        await tx.extractionMetadata.deleteMany({ where: { articleId: { in: articleIds } } });
        await tx.article.deleteMany({ where: { id: { in: articleIds } } });
      }

      await tx.sourceRun.deleteMany({ where: { sourceId: id } });
      await tx.source.delete({ where: { id } });
    });

    res.json({ success: true, message: 'Đã xóa nguồn cào tin thành công!' });
  } catch (err: any) {
    console.error('Delete source error:', err);
    res.status(500).json({ error: 'FAILED_TO_DELETE', message: 'Lỗi khi xóa nguồn cào tin: ' + err.message });
  }
});

app.post('/api/v1/sources/:id/test', authenticateUser, csrfProtection, async (req: Request, res: Response) => {
  const { id } = req.params;
  const source = await prisma.source.findUnique({ where: { id } });

  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }

  try {
    const adapter = source.type === 'RSS' ? new RssScraperAdapter() : new CheerioScraperAdapter();
    const articles = await adapter.fetchArticles(source.url, source.selectorsJson);

    let newCount = 0;
    for (const item of articles) {
      const existing = await prisma.article.findUnique({ where: { canonicalUrl: item.canonicalUrl } });
      if (!existing) {
        await prisma.article.create({
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
        newCount++;
      }
    }

    await prisma.source.update({
      where: { id: source.id },
      data: { lastRunAt: new Date() },
    });

    // Auto-trigger AI generation & auto-publishing to Facebook
    const { runAiGenerationWorker } = require('../../worker-engine/src/workers/ai-worker');
    runAiGenerationWorker(prisma).catch((err: any) => console.error('[AI Auto-Publish Error]:', err));

    res.json({
      success: true,
      message: `Quét tin & Đăng bài tự động thành công! Tìm thấy ${articles.length} bài viết (${newCount} bài viết mới đã được đẩy sang AI đăng Fanpage).`,
      totalScraped: articles.length,
      newArticlesCount: newCount,
      sampleArticles: articles.slice(0, 3).map((a) => ({ title: a.title, url: a.canonicalUrl })),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'TEST_SCRAPE_FAILED', message: err.message });
  }
});

// Facebook Page Configuration Endpoints
app.get('/api/v1/facebook/pages', authenticateUser, async (_req, res) => {
  const pages = await prisma.facebookPage.findMany({
    orderBy: { createdAt: 'desc' },
  });
  const sanitized = pages.map((p) => ({
    id: p.id,
    pageId: p.pageId,
    name: p.name,
    isValid: p.isValid,
    hasToken: !!p.encryptedAccessToken,
    updatedAt: p.updatedAt,
  }));
  res.json({ data: sanitized });
});

app.get('/api/v1/facebook/oauth/login', (req: Request, res: Response) => {
  const appId = process.env.META_APP_ID || '4591458491138366';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '127.0.0.1:4000';
  const redirectUri = encodeURIComponent(`${protocol}://${host}/api/v1/facebook/oauth/callback`);
  const scope = encodeURIComponent('pages_read_engagement,pages_show_list,business_management');
  const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token`;
  res.redirect(authUrl);
});

app.get('/api/v1/facebook/oauth/callback', (_req: Request, res: Response) => {
  res.send(`
    <html>
      <body style="font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #f8fafc;">
        <h2 id="title" style="color: #2563eb; font-size: 20px;">🔵 ĐANG XÁC THỰC KẾT NỐI FACEBOOK...</h2>
        <p id="msg" style="color: #64748b; font-size: 14px;">Vui lòng chờ hệ thống tự động xử lý trong giây lát.</p>
        <script>
          async function processOAuthToken() {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const errorMsg = params.get('error_description') || params.get('error');

            if (errorMsg || !accessToken) {
              document.getElementById('title').style.color = '#dc2626';
              document.getElementById('title').innerText = '🔴 KẾT NỐI FACEBOOK THẤT BẠI';
              document.getElementById('msg').innerText = errorMsg || 'Người dùng đã hủy hoặc không tìm thấy mã Token.';
              setTimeout(() => window.close(), 3000);
              return;
            }

            try {
              const res = await fetch('/api/v1/facebook/oauth/save-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userToken: accessToken }),
              });
              const data = await res.json();

              if (data.success) {
                document.getElementById('title').style.color = '#166534';
                document.getElementById('title').innerText = '🟢 KẾT NỐI FANPAGE FACEBOOK THÀNH CÔNG!';
                document.getElementById('msg').innerText = data.message || 'Đã tự động liên kết Fanpage vào hệ thống.';
                if (window.opener) {
                  window.opener.postMessage({ type: 'FB_CONNECTED', count: data.count }, '*');
                }
                setTimeout(() => window.close(), 2000);
              } else {
                throw new Error(data.message || 'Lỗi lưu Token Fanpage.');
              }
            } catch (err) {
              document.getElementById('title').style.color = '#dc2626';
              document.getElementById('title').innerText = '🔴 LỖI LIÊN KẾT FANPAGE';
              document.getElementById('msg').innerText = err.message;
            }
          }
          processOAuthToken();
        </script>
      </body>
    </html>
  `);
});

app.post('/api/v1/facebook/oauth/save-token', async (req: Request, res: Response) => {
  const { userToken } = req.body;
  if (!userToken) {
    return res.status(400).json({ success: false, message: 'Thiếu userToken' });
  }

  try {
    const pagesRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${userToken}`);
    const pagesData: any = await pagesRes.json();

    if (pagesData.error) {
      return res.status(400).json({ success: false, message: pagesData.error.message || 'Lỗi đọc danh sách Fanpage từ Facebook' });
    }

    const pages = pagesData?.data || [];
    let savedCount = 0;

    for (const pageItem of pages) {
      const encryptedAccessToken = secretManager.encrypt(pageItem.access_token);
      await prisma.facebookPage.upsert({
        where: { pageId: pageItem.id },
        update: {
          name: pageItem.name,
          encryptedAccessToken,
          isValid: true,
        },
        create: {
          pageId: pageItem.id,
          name: pageItem.name,
          encryptedAccessToken,
          isValid: true,
        },
      });
      savedCount++;
    }

    res.json({
      success: true,
      count: savedCount,
      message: `Đã tự động liên kết ${savedCount} Fanpage vào hệ thống!`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi server khi lưu Token' });
  }
});

app.post('/api/v1/facebook/pages/verify', authenticateUser, async (req: Request, res: Response) => {
  const { pageId, accessToken } = req.body;
  if (!pageId || !accessToken) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ Page ID và Page Access Token.' });
  }

  const result = await facebookClient.verifyPageToken(pageId, accessToken);

  if (result.valid) {
    const pageName = result.name || 'Facebook Fanpage';
    const encryptedAccessToken = secretManager.encrypt(accessToken);
    await prisma.facebookPage.upsert({
      where: { pageId },
      update: {
        name: pageName,
        encryptedAccessToken,
        isValid: true,
      },
      create: {
        pageId,
        name: pageName,
        encryptedAccessToken,
        isValid: true,
      },
    });

    const namePart = result.name ? ` Fanpage: "${result.name}"` : ` Page ID: ${pageId}`;
    res.json({
      success: true,
      isValid: true,
      message: `🟢 Token hợp lệ! Đã xác thực & tự động lưu cấu hình cho${namePart}.`,
      page: { id: pageId, name: result.name },
    });
  } else {
    res.json({
      success: false,
      isValid: false,
      message: `🔴 ${result.reason || 'Token không hợp lệ.'}`,
    });
  }
});

app.post('/api/v1/facebook/pages', authenticateUser, csrfProtection, async (req: Request, res: Response) => {
  const { pageId, name, accessToken } = req.body;
  if (!pageId || !name || !accessToken) {
    return res.status(400).json({ error: 'Page ID, Fanpage Name, and Page Access Token are required' });
  }

  try {
    const encryptedAccessToken = secretManager.encrypt(accessToken);
    const fbPage = await prisma.facebookPage.upsert({
      where: { pageId },
      update: {
        name,
        encryptedAccessToken,
        isValid: true,
      },
      create: {
        pageId,
        name,
        encryptedAccessToken,
        isValid: true,
      },
    });

    res.json({
      success: true,
      message: 'Cấu hình Facebook Fanpage thành công!',
      data: {
        id: fbPage.id,
        pageId: fbPage.pageId,
        name: fbPage.name,
        isValid: fbPage.isValid,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'FAILED_TO_SAVE_PAGE', message: err.message });
  }
});

app.post('/api/v1/facebook/pages/:id/test', authenticateUser, csrfProtection, async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = await prisma.facebookPage.findUnique({ where: { id } });
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  try {
    const pageAccessToken = secretManager.decrypt(page.encryptedAccessToken);
    const pageDetails = await facebookClient.getPageDetails(page.pageId, pageAccessToken);
    await prisma.facebookPage.update({ where: { id }, data: { isValid: true } });

    res.json({
      success: true,
      isValid: true,
      message: `🟢 Token hoạt động tốt! Đã kết nối với Fanpage: "${pageDetails.name}"`,
      pageDetails,
    });
  } catch (err: any) {
    await prisma.facebookPage.update({ where: { id }, data: { isValid: false } });
    const classified = facebookClient.classifyError(err);
    res.json({
      success: false,
      isValid: false,
      message: `🔴 Lỗi kết nối / Token hết hạn: ${classified.errorMessage || err.message}`,
    });
  }
});

app.delete('/api/v1/facebook/pages/:id', authenticateUser, csrfProtection, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      // Xóa publication_attempts → publications liên quan trước
      const pubs = await tx.publication.findMany({ where: { facebookPageId: id }, select: { id: true } });
      const pubIds = pubs.map((p) => p.id);
      if (pubIds.length > 0) {
        await tx.publicationAttempt.deleteMany({ where: { publicationId: { in: pubIds } } });
        await tx.publication.deleteMany({ where: { facebookPageId: id } });
      }
      await tx.facebookPage.delete({ where: { id } });
    });
    res.json({ success: true, message: 'Đã xóa Fanpage khỏi hệ thống thành công!' });
  } catch (err: any) {
    console.error('Delete FB page error:', err.message);
    res.status(400).json({ error: 'FAILED_TO_DELETE', message: err.message || 'Không thể xóa Fanpage này.' });
  }
});

// Posts & Publications Endpoints
app.get('/api/v1/posts', authenticateUser, async (req: Request, res: Response) => {
  const count = await prisma.post.count();
  if (count === 0) {
    const articles = await prisma.article.findMany({ take: 10, orderBy: { fetchedAt: 'desc' } });
    if (articles.length > 0) {
      const aiRewriter = new GeminiRewriterService();
      let activePrompt = await prisma.promptVersion.findFirst({ where: { isActive: true } });
      if (!activePrompt) {
        activePrompt = await prisma.promptVersion.create({
          data: {
            version: 1,
            promptTemplate: 'Tiêu đề: {title}',
            jsonSchema: {},
            modelName: 'gemini-1.5-flash',
            isActive: true,
          },
        });
      }

      for (const article of articles) {
        const result = await aiRewriter.rewriteArticle(article.title, article.rawSummary || '');
        const post = await prisma.post.create({
          data: {
            articleId: article.id,
            promptVersionId: activePrompt.id,
            generationStatus: 'GENERATED',
            reviewStatus: 'IN_REVIEW',
            sensitivityFlag: result.sensitivity_flag,
            isAutoPublishEligible: !result.sensitivity_flag,
          },
        });
        const revision = await prisma.postRevision.create({
          data: {
            postId: post.id,
            revisionNumber: 1,
            caption: result.facebook_caption,
            inputHash: crypto.randomUUID(),
          },
        });
        await prisma.post.update({ where: { id: post.id }, data: { currentRevisionId: revision.id } });
      }
    }
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const totalCount = await prisma.post.count();
  const posts = await prisma.post.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      article: true,
      currentRevision: true,
      publications: { include: { facebookPage: true } },
    },
  });

  const sanitized = posts.map(sanitizePost);
  res.json({ data: sanitized, totalCount });
});

app.post('/api/v1/posts/:id/approve', authenticateUser, csrfProtection, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { caption, facebookPageId } = req.body;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: { article: true, currentRevision: true },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await prisma.post.update({
      where: { id },
      data: { reviewStatus: 'APPROVED' },
    });

    if (caption && post.currentRevisionId) {
      await prisma.postRevision.update({
        where: { id: post.currentRevisionId },
        data: { caption },
      });
    }

    let targetPage = null;
    if (facebookPageId) {
      targetPage = await prisma.facebookPage.findUnique({ where: { id: facebookPageId } });
    }
    if (!targetPage) {
      targetPage = await prisma.facebookPage.findFirst({ where: { isValid: true } });
    }

    if (!targetPage) {
      return res.json({ success: true, message: 'Đã duyệt bài viết! (Vui lòng cấu hình Fanpage trong Settings để đăng bài)' });
    }

    const finalCaption = caption || post.currentRevision?.caption || post.article.title;
    const fullCaption = `${finalCaption}\n\nNguồn: ${post.article.canonicalUrl}`;
    const pageAccessToken = secretManager.decrypt(targetPage.encryptedAccessToken);

    try {
      const fbRes = await facebookClient.publishFeedPost(targetPage.pageId, pageAccessToken, {
        caption: fullCaption,
        linkUrl: post.article.canonicalUrl,
      });

      const publication = await prisma.publication.create({
        data: {
          postId: post.id,
          postRevisionId: post.currentRevisionId || '',
          facebookPageId: targetPage.id,
          status: 'PUBLISHED',
          fbPostId: fbRes.id,
          scheduledAt: new Date(),
          publishedAt: new Date(),
          idempotencyKey: crypto.randomUUID(),
        },
      });

      return res.json({
        success: true,
        message: 'Đã duyệt và đăng bài viết trực tiếp lên Facebook Fanpage thành công!',
        data: publication,
      });
    } catch (fbErr: any) {
      console.error('FB publish error:', fbErr.message);
      const publication = await prisma.publication.create({
        data: {
          postId: post.id,
          postRevisionId: post.currentRevisionId || '',
          facebookPageId: targetPage.id,
          status: 'FAILED_PERMANENT',
          scheduledAt: new Date(),
          idempotencyKey: crypto.randomUUID(),
        },
      });
      return res.json({
        success: true,
        message: `Đã duyệt bài! Lỗi đăng Facebook: ${fbErr.message}`,
        data: publication,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'FAILED_TO_APPROVE', message: err.message });
  }
});

app.get('/api/v1/publications', authenticateUser, async (_req, res) => {
  const publications = await prisma.publication.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      post: true,
      postRevision: true,
      facebookPage: true,
      attempts: { orderBy: { attemptNumber: 'desc' } },
    },
  });

  const sanitized = publications.map(sanitizePublication);
  res.json({ data: sanitized });
});

// POST /api/v1/publications/:id/reconcile - Operator Reconcile (SUPER_ADMIN ONLY)
app.post(
  '/api/v1/publications/:id/reconcile',
  authenticateUser,
  requireRole(Role.SUPER_ADMIN),
  csrfProtection,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { action, fbPostId, note } = req.body;

    const publication = await prisma.publication.findUnique({
      where: { id },
      include: { facebookPage: true, postRevision: true },
    });

    if (!publication || publication.status !== 'UNKNOWN') {
      return res
        .status(400)
        .json({ error: 'Publication not found or not in UNKNOWN status.' });
    }

    if (action === 'MARK_PUBLISHED') {
      if (!fbPostId) {
        return res.status(400).json({ error: 'fbPostId is required when marking published.' });
      }

      try {
        const pageToken = secretManager.decrypt(publication.facebookPage.encryptedAccessToken);
        const feedItems = await facebookClient.getPageFeed(publication.facebookPage.pageId, pageToken, 20);

        const matched = feedItems.find(
          (item: any) =>
            item.id === fbPostId ||
            (item.message && item.message.includes(publication.postRevision.caption.substring(0, 30)))
        );

        if (!matched) {
          return res.status(400).json({
            error: 'META_VERIFICATION_FAILED',
            message: 'Target fbPostId or caption was not found on Facebook page feed.',
          });
        }
      } catch (err: any) {
        return res.status(500).json({
          error: 'META_API_ERROR',
          message: `Failed to verify post on Facebook: ${err.message}`,
        });
      }

      await prisma.$transaction(async (tx: any) => {
        await tx.publication.update({
          where: { id },
          data: {
            status: 'PUBLISHED',
            fbPostId,
            publishedAt: new Date(),
          },
        });

        await tx.auditEvent.create({
          data: {
            userId: req.user?.id,
            action: 'OPERATOR_RECONCILE_MARK_PUBLISHED',
            resourceType: 'PUBLICATION',
            resourceId: id,
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'AdminUI',
            payloadBefore: { status: 'UNKNOWN' },
            payloadAfter: { status: 'PUBLISHED', fbPostId, note },
          },
        });
      });

      return res.json({ success: true, newStatus: 'PUBLISHED' });
    } else if (action === 'FORCE_REQUEUE') {
      const dedupeKey = `pub_requeue_${id}_${Date.now()}`;

      await prisma.$transaction(async (tx: any) => {
        await tx.publication.update({
          where: { id },
          data: {
            status: 'QUEUED',
          },
        });

        await tx.outboxEvent.create({
          data: {
            dedupeKey,
            aggregateType: 'PUBLICATION',
            aggregateId: id,
            eventType: 'PUBLICATION_QUEUED',
            payloadJson: {
              publicationId: id,
              facebookPageId: publication.facebookPageId,
              idempotencyKey: publication.idempotencyKey,
            },
            status: 'PENDING',
            scheduledAt: new Date(),
          },
        });

        await tx.auditEvent.create({
          data: {
            userId: req.user?.id,
            action: 'OPERATOR_RECONCILE_FORCE_REQUEUE',
            resourceType: 'PUBLICATION',
            resourceId: id,
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'AdminUI',
            payloadBefore: { status: 'UNKNOWN' },
            payloadAfter: { status: 'QUEUED', dedupeKey, note },
          },
        });
      });

      return res.json({ success: true, newStatus: 'QUEUED' });
    } else {
      return res.status(400).json({ error: 'Invalid reconcile action.' });
    }
  }
);

const server = app.listen(PORT, () => {
  console.log(`[API Server] Secure API listening on http://localhost:${PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[API Server] Port ${PORT} busy, killing old process...`);
    const { execSync } = require('child_process');
    try {
      execSync(
        `foreach ($c in (Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue)) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }`,
        { shell: 'powershell.exe', timeout: 5000 }
      );
    } catch { /* ignore */ }
    setTimeout(() => {
      server.listen(PORT, () => {
        console.log(`[API Server] Secure API listening on http://localhost:${PORT} (retry)`);
      });
    }, 1500);
  } else {
    console.error('[API Server] Fatal error:', err);
    process.exit(1);
  }
});
