import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding database baseline data...');

  const passwordHash = await bcrypt.hash('AdminSecurePass123!', 10);

  // 1. Create Default Super Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@fbpage.local' },
    update: {},
    create: {
      email: 'admin@fbpage.local',
      passwordHash,
      fullName: 'Super Administrator',
      isMfaEnabled: false,
      roles: {
        create: [{ role: Role.SUPER_ADMIN }, { role: Role.EDITOR }],
      },
    },
  });

  console.log(`[Seed] Created Super Admin User: ${adminUser.email}`);

  // 2. Create Active Prompt Version
  const prompt = await prisma.promptVersion.upsert({
    where: { version: 1 },
    update: { isActive: true },
    create: {
      version: 1,
      modelName: 'gemini-1.5-flash',
      isActive: true,
      promptTemplate: `Tóm tắt bài báo và tạo bài đăng Fanpage tiếng Việt hấp dẫn.`,
      jsonSchema: {},
    },
  });

  console.log(`[Seed] Created Active Prompt Version v${prompt.version}`);

  // 3. Create Default Sources
  await prisma.source.upsert({
    where: { url: 'https://nghean24h.vn/c/phap-luat' },
    update: {},
    create: {
      name: 'Nghệ An 24h - Tin Pháp luật',
      url: 'https://nghean24h.vn/c/phap-luat',
      type: 'HTML_SCRAPE',
      intervalMinutes: 5,
      status: 'ACTIVE',
    },
  });

  await prisma.source.upsert({
    where: { url: 'https://nghean24h.vn/c/trong-tinh' },
    update: {},
    create: {
      name: 'Nghệ An 24h - Tin Trong tỉnh',
      url: 'https://nghean24h.vn/c/trong-tinh',
      type: 'HTML_SCRAPE',
      intervalMinutes: 5,
      status: 'ACTIVE',
    },
  });

  console.log('[Seed] Created Default Ingestion Sources.');

  // 4. Create Sample Facebook Page Metadata
  const masterKey = process.env.MASTER_ENCRYPTION_KEY || '00'.repeat(32);
  const dummyToken = 'EAABsbCS1...dummytoken';
  
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(masterKey, 'hex'), iv);
  let encrypted = cipher.update(dummyToken, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  const encryptedAccessToken = `${iv.toString('hex')}:${authTag}:${encrypted}`;

  await prisma.facebookPage.upsert({
    where: { pageId: '100123456789' },
    update: {},
    create: {
      pageId: '100123456789',
      name: 'Fanpage Tin Tức Nghệ An',
      encryptedAccessToken,
      isValid: true,
    },
  });

  console.log('[Seed] Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
