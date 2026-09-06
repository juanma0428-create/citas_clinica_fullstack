import crypto from 'crypto';

// 32-byte key for AES-256
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') 
  : crypto.createHash('sha256').update('sys_citas_medical_encryption_secret_2026').digest();

const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'enc:';

export function encryptSensitiveData(text: string | null | undefined): string | null {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: enc:iv:authTag:encryptedData
    return `${PREFIX}${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('Error encrypting data:', err);
    return text;
  }
}

export function decryptSensitiveData(cipherText: string | null | undefined): string | null {
  if (!cipherText) return null;
  
  // If not encrypted with our prefix (e.g. initial plaintext dump data), return as is
  if (!cipherText.startsWith(PREFIX)) {
    return cipherText;
  }
  
  try {
    const parts = cipherText.substring(PREFIX.length).split(':');
    if (parts.length !== 3) return cipherText;
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Error decrypting data:', err);
    return cipherText;
  }
}
