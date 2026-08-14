import "server-only";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGO = "aes-256-gcm";

function deriveKey(): Buffer {
  const secret = process.env.VOICE_ENCRYPTION_KEY ?? process.env.NEXTAUTH_SECRET ?? "parenfy-dev-voice-key";
  return scryptSync(secret, "parenfy-voice-v1", 32);
}

/** Encrypt voice recording bytes for storage (AES-256-GCM). */
export function encryptVoiceBuffer(data: Buffer): Buffer {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

/** Decrypt voice recording bytes from storage. */
export function decryptVoiceBuffer(payload: Buffer): Buffer {
  const key = deriveKey();
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
