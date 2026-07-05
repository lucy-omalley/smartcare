import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/db";

const RESET_PREFIX = "password-reset:";
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function resetTokenIdentifier(email: string): string {
  return `${RESET_PREFIX}${normalizeEmail(email)}`;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function resolveAuthBaseUrl(): string {
  const configured = process.env.NEXTAUTH_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  const identifier = resetTokenIdentifier(normalized);
  const rawToken = generateResetToken();
  const tokenHash = hashToken(rawToken);
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: { identifier },
  });

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: tokenHash,
      expires,
    },
  });

  return rawToken;
}

export async function consumePasswordResetToken(
  rawToken: string
): Promise<{ email: string } | null> {
  const tokenHash = hashToken(rawToken.trim());
  const record = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
  });

  if (!record || !record.identifier.startsWith(RESET_PREFIX)) {
    return null;
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { token: tokenHash },
    }).catch(() => {});
    return null;
  }

  const email = record.identifier.slice(RESET_PREFIX.length);
  await prisma.verificationToken.delete({
    where: { token: tokenHash },
  });

  return { email };
}

export function buildResetPasswordUrl(rawToken: string): string {
  const baseUrl = resolveAuthBaseUrl();
  return `${baseUrl}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;
}
