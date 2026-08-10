require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('db-prisma');
const { SecretManager } = require('secret-manager');
const { MetaGraphApiClient } = require('facebook-client');

const prisma = new PrismaClient();
const secretManager = new SecretManager();
const facebookClient = new MetaGraphApiClient();

const newTokens = [
  'EABBP6DxdgT4BSE0zHs8BP6A3AWjMZBOcUgziry3NnEZBYZCJS9ipAY8lJ49ShXnb84DLuL6WPePxZBWZAoZAaV2fRNWgYPhMtxAocj8A7Jc2a0iBhAoYSsKSdJYeuSwwc692xzGLfHegjHxtEBfia5xroIYpMdDi3dQUzX6s2oMulusuPrjvHCTE15xZAYm31TGdEJJhqkwdgYpk4kniliPKOkRzvwLj7VOLngLLsDCU1xOH1n3auLb0vcHES0ZB'
];

async function run() {
  for (const token of newTokens) {
    console.log('🔍 Testing token...');
    // 1. Debug token info
    const debugRes = await fetch(`https://graph.facebook.com/v20.0/debug_token?input_token=${token}&access_token=${token}`);
    const debugData = await debugRes.json();
    console.log('Debug token output:', JSON.stringify(debugData, null, 2));

    // 2. Fetch page accounts
    const accRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${token}`);
    const accData = await accRes.json();
    console.log('Accounts output:', JSON.stringify(accData, null, 2));

    if (accData.data && accData.data.length > 0) {
      for (const pageItem of accData.data) {
        console.log(`✅ Found Page Token for "${pageItem.name}" (ID: ${pageItem.id})!`);
        const pageToken = pageItem.access_token;
        const encryptedAccessToken = secretManager.encrypt(pageToken);

        await prisma.facebookPage.upsert({
          where: { pageId: pageItem.id },
          update: { name: pageItem.name, encryptedAccessToken, isValid: true },
          create: { pageId: pageItem.id, name: pageItem.name, encryptedAccessToken, isValid: true },
        });

        console.log(`💾 Saved Page Token into Database!`);

        // Test publishing latest post!
        const latestPost = await prisma.post.findFirst({
          include: { article: true, currentRevision: true },
          orderBy: { createdAt: 'desc' },
        });

        if (latestPost && latestPost.currentRevision) {
          console.log(`🚀 Publishing post: "${latestPost.article.title}"...`);
          let caption = latestPost.currentRevision.caption;
          if (latestPost.article.canonicalUrl) caption += '\n\nNguồn: ' + latestPost.article.canonicalUrl;

          const pubRes = await facebookClient.publishFeedPost(pageItem.id, pageToken, {
            caption,
            linkUrl: latestPost.article.canonicalUrl,
          });

          await prisma.post.update({
            where: { id: latestPost.id },
            data: { reviewStatus: 'APPROVED' },
          });

          console.log(`🎉 🎉 🎉 ĐĂNG BÀI LÊN FACEBOOK FANPAGE THÀNH CÔNG 100%!`);
          console.log(`🆔 FB Post ID: ${pubRes.id}`);
          return;
        }
      }
    } else if (debugData.data && debugData.data.type === 'PAGE') {
      // It is directly a Page Token!
      const pageId = debugData.data.profile_id || '1235062086365796';
      console.log(`✅ Direct Page Token detected for Page ID: ${pageId}!`);
      const encryptedAccessToken = secretManager.encrypt(token);

      await prisma.facebookPage.upsert({
        where: { pageId },
        update: { name: 'Nghệ An 24h', encryptedAccessToken, isValid: true },
        create: { pageId, name: 'Nghệ An 24h', encryptedAccessToken, isValid: true },
      });

      console.log(`💾 Saved Direct Page Token into Database!`);

      const latestPost = await prisma.post.findFirst({
        include: { article: true, currentRevision: true },
        orderBy: { createdAt: 'desc' },
      });

      if (latestPost && latestPost.currentRevision) {
        console.log(`🚀 Publishing post: "${latestPost.article.title}"...`);
        let caption = latestPost.currentRevision.caption;
        if (latestPost.article.canonicalUrl) caption += '\n\nNguồn: ' + latestPost.article.canonicalUrl;

        const pubRes = await facebookClient.publishFeedPost(pageId, token, {
          caption,
          linkUrl: latestPost.article.canonicalUrl,
        });

        await prisma.post.update({
          where: { id: latestPost.id },
          data: { reviewStatus: 'APPROVED' },
        });

        console.log(`🎉 🎉 🎉 ĐĂNG BÀI LÊN FACEBOOK FANPAGE THÀNH CÔNG 100%!`);
        console.log(`🆔 FB Post ID: ${pubRes.id}`);
        return;
      }
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
