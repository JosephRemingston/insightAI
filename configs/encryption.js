import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const algorithm = "aes-256-gcm";

// AES-256 requires a 32-byte (256-bit) key
// Generate key from environment variable or use a default (for development only)
const getEncryptionKey = () => {
  const secret = process.env.DB_ENCRYPTION_KEY;
  
  if (!secret) {
    throw new Error('DB_ENCRYPTION_KEY environment variable is not set');
  }
  
  // Create a 32-byte key using SHA-256 hash of the secret
  return crypto.createHash('sha256').update(secret).digest();
};

const key = getEncryptionKey();

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    content: encrypted,
    iv: iv.toString("hex"),
    tag: cipher.getAuthTag().toString("hex"),
  };
}

function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(encrypted.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(encrypted.tag, "hex"));

  let decrypted = decipher.update(encrypted.content, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export {encrypt, decrypt};