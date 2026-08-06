import crypto from "crypto";

// Cifrado de las API keys de IA que cada tenant pega en /configuracion
// (BYOK) — nunca se guardan en claro en Postgres. AES-256-GCM con el
// módulo `crypto` nativo de Node, sin dependencia nueva. La clave sale
// de ENCRYPTION_KEY (64 caracteres hex = 32 bytes), una variable de
// entorno de servidor nueva que hay que configurar en Vercel — generarla
// una vez con `openssl rand -hex 32` y nunca rotarla sin re-cifrar las
// keys existentes (perderías acceso a ellas).
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY no está configurada");
  const buf = Buffer.from(key, "hex");
  if (buf.length !== 32) {
    throw new Error("ENCRYPTION_KEY debe ser 64 caracteres hex (32 bytes) — usa `openssl rand -hex 32`");
  }
  return buf;
}

/** iv (12) + authTag (16) + ciphertext, todo junto en base64. */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decrypt(encoded: string): string {
  const raw = Buffer.from(encoded, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/** Para mostrar en la UI sin nunca devolver la key completa al cliente. */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}${"•".repeat(8)}${key.slice(-4)}`;
}
