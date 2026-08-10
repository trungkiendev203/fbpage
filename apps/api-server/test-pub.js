require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('db-prisma');
const { MetaGraphApiClient } = require('facebook-client');
const { SecretManager } = require('secret-manager');

const prisma = new PrismaClient();
const secretManager = new SecretManager();
const facebookClient = new MetaGraphApiClient();

async function run() {
  const page = await prisma.facebookPage.findFirst({ where: { isValid: true }, orderBy: { createdAt: 'desc' } });
  console.log('Page found:', page?.name, page?.pageId);
  if (!page) return;

  const latestPost = await prisma.post.findFirst({
    include: { article: true, currentRevision: true },
    orderBy: { createdAt: 'desc' },
  });

  console.log('Post found:', latestPost?.article?.title);
  if (!latestPost || !latestPost.currentRevision) return;

  const token = secretManager.decrypt(page.encryptedAccessToken);
  let caption = latestPost.currentRevision.caption;
  if (latestPost.article.canonicalUrl) caption += '\n\nNguồn: ' + latestPost.article.canonicalUrl;

  try {
    const res = await facebookClient.publishFeedPost(page.pageId, token, {
      caption,
      linkUrl: latestPost.article.canonicalUrl,
    });
    console.log('SUCCESS! FB Post ID:', res.id);
  } catch (err) {
    console.error('FB publish error:', err.response?.data || err.message);
  }
}

run().finally(() => prisma.$disconnect());
