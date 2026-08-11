import "server-only";

import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/db";
import { sendEmailVerificationEmail } from "@/lib/email/send-email";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function baseUrl(): string {
  return (
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export async function createAndSendVerificationEmail(userId: string, email: string): Promise<{
  sent: boolean;
  devVerifyUrl?: string;
}> {
  const rawToken = randomBytes(32).toString("hex");
  const hashed = hashToken(rawToken);
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: { identifier: `email-verify:${email.toLowerCase()}` },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: `email-verify:${email.toLowerCase()}`,
      token: hashed,
      expires,
    },
  });

  const verifyUrl = `${baseUrl()}/api/auth/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;
  const result = await sendEmailVerificationEmail(email, verifyUrl);

  if (process.env.NODE_ENV === "development" && result.devMode) {
    return { sent: false, devVerifyUrl: verifyUrl };
  }

  return { sent: result.sent };
}

export async function verifyEmailToken(
  email: string,
  rawToken: string
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const hashed = hashToken(rawToken.trim());

  const record = await prisma.verificationToken.findFirst({
    where: {
      identifier: `email-verify:${normalizedEmail}`,
      token: hashed,
    },
  });

  if (!record) {
    return { ok: false, error: "Invalid or expired verification link." };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    });
    return { ok: false, error: "This verification link has expired. Request a new one." };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (!user) {
    return { ok: false, error: "Account not found." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    }),
  ]);

  await Promise.allSettled([
    import("@/lib/analytics/persist").then(({ persistAnalyticsEvent }) =>
      persistAnalyticsEvent("email_verified", user.id, { method: "email_link" })
    ),
  ]);

  return { ok: true, userId: user.id };
}

export function isEmailVerified(user: { emailVerified: Date | null; isAdmin?: boolean }): boolean {
  if (user.isAdmin) return true;
  return user.emailVerified != null;
}
