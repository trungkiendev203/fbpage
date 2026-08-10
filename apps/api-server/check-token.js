require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('db-prisma');
const { MetaGraphApiClient } = require('facebook-client');
const { SecretManager } = require('secret-manager');

const prisma = new PrismaClient();
const secretManager = new SecretManager();
const facebookClient = new MetaGraphApiClient();

async function check() {
  const pages = await prisma.facebookPage.findMany();
  console.log('Total pages in DB:', pages.length);
  for (const p of pages) {
    const token = secretManager.decrypt(p.encryptedAccessToken);
    console.log(`Page: "${p.name}" (ID: ${p.pageId})`);
    console.log(`Token prefix: ${token.substring(0, 20)}... length: ${token.length}`);
    try {
      const details = await facebookClient.getPageDetails(p.pageId, token);
      console.log('Details:', details.id, details.name);
    } catch (err) {
      console.error('Details Error:', err.response?.data || err.message);
    }
  }
}

check().finally(() => prisma.$disconnect());
