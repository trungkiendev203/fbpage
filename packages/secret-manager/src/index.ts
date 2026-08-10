import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const DEFAULT_DEV_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

export class SecretManager {
  private masterKey: Buffer;

  constructor(masterKeyHex?: string) {
    const keyHex = masterKeyHex || process.env.MASTER_ENCRYPTION_KEY || DEFAULT_DEV_KEY;
    if (!keyHex || keyHex.length !== 64) {
      throw new Error(
        'MASTER_ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes).'
      );
    }
    this.masterKey = Buffer.from(keyHex, 'hex');
  }

  public encrypt(plainText: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  public decrypt(cipherTextWithMeta: string): string {
    const parts = cipherTextWithMeta.split(':');
    if (parts.length !== 3) {
      throw new Error('Malformed encrypted secret payload.');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

export const defaultSecretManager = new SecretManager();
