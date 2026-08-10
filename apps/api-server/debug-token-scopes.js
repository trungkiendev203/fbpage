require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('db-prisma');
const { SecretManager } = require('secret-manager');

const prisma = new PrismaClient();
const secretManager = new SecretManager();

async function debugScopes() {
  const page = await prisma.facebookPage.findFirst();
  if (!page) return;
  const token = secretManager.decrypt(page.encryptedAccessToken);
  
  const res = await fetch(`https://graph.facebook.com/v20.0/debug_token?input_token=${token}&access_token=${token}`);
  const data = await res.json();
  console.log('Token Type / Data:', JSON.stringify(data, null, 2));
}

debugScopes().catch(err => console.error(err)).finally(() => prisma.$disconnect());
