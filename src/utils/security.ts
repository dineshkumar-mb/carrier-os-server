import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 10000;

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'fallback-encryption-secret-key-12345';

const getKey = (salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(ENCRYPTION_SECRET, salt, ITERATIONS, KEY_LENGTH, 'sha512');
};

export const encryptText = (text: string): string => {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getKey(salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  const payload = Buffer.concat([salt, iv, Buffer.from(authTag, 'hex'), Buffer.from(encrypted, 'hex')]);
  return payload.toString('base64');
};

export const decryptText = (payloadBase64: string): string => {
  if (!payloadBase64) return '';
  try {
    if (!/^[a-zA-Z0-9+/=]+$/.test(payloadBase64)) {
      return payloadBase64;
    }
    const payload = Buffer.from(payloadBase64, 'base64');
    if (payload.length < SALT_LENGTH + IV_LENGTH + 16) {
      return payloadBase64;
    }
    
    const salt = payload.subarray(0, SALT_LENGTH);
    const iv = payload.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = payload.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + 16);
    const encryptedText = payload.subarray(SALT_LENGTH + IV_LENGTH + 16);
    
    const key = getKey(salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return payloadBase64;
  }
};
