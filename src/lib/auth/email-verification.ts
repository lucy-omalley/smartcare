import "server-only";

import { randomBytes, createHash } from "crypto";
import { subHours, subDays } from "date-fns";
import { prisma } from "@/lib/db";
import {
  sendEmailVerificationEmail,
  sendEmailVerificationReminderEmail,
} from "@/lib/email/send-email";
import { looksLikeBotRegistration } from "@/lib/bot-detection";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export type VerificationReminderKind = "auto_1h" | "auto_24h" | "manual" | "founder_batch";

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

async function createVerificationToken(email: string): Promise<string> {
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

  return `${baseUrl()}/api/auth/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;
}

export async function createAndSendVerificationEmail(
  userId: string,
  email: string,
  firstName?: string | null
): Promise<{
  sent: boolean;
  devVerifyUrl?: string;
}> {
  const verifyUrl = await createVerificationToken(email);
  const result = await sendEmailVerificationEmail(email, verifyUrl, firstName);

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

function firstNameFromUser(name: string | null | undefined): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}

function isLikelyBot(user: { name: string | null; email: string }): boolean {
  return looksLikeBotRegistration(user.name ?? "", user.email);
}

const MIN_HOURS_BETWEEN_REMINDERS = 20;

async function recentlyReminded(userId: string): Promise<boolean> {
  const cutoff = subHours(new Date(), MIN_HOURS_BETWEEN_REMINDERS);
  const recent = await prisma.emailVerificationReminder.findFirst({
    where: { userId, sentAt: { gte: cutoff } },
    select: { id: true },
  });
  return recent != null;
}

async function hasReminderKind(userId: string, kind: VerificationReminderKind): Promise<boolean> {
  const existing = await prisma.emailVerificationReminder.findFirst({
    where: { userId, kind },
    select: { id: true },
  });
  return existing != null;
}

export async function sendVerificationReminderToUser(
  userId: string,
  kind: VerificationReminderKind,
  opts?: { skipBotCheck?: boolean; skipCooldown?: boolean }
): Promise<{ sent: boolean; skipped?: string; error?: string; devVerifyUrl?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      password: true,
      isAdmin: true,
    },
  });

  if (!user?.email) return { sent: false, skipped: "User not found" };
  if (user.emailVerified) return { sent: false, skipped: "Already verified" };
  if (!user.password) return { sent: false, skipped: "OAuth account — no email verify needed" };
  if (!opts?.skipBotCheck && isLikelyBot(user)) {
    return { sent: false, skipped: "Skipped likely bot account" };
  }

  if (kind.startsWith("auto_")) {
    if (await hasReminderKind(userId, kind)) {
      return { sent: false, skipped: `Already sent ${kind}` };
    }
  } else if (!opts?.skipCooldown && (await recentlyReminded(userId))) {
    return { sent: false, skipped: "Reminder sent recently" };
  }

  const verifyUrl = await createVerificationToken(user.email);
  const firstName = firstNameFromUser(user.name);
  const result = await sendEmailVerificationReminderEmail(user.email, verifyUrl, firstName);

  if (process.env.NODE_ENV === "development" && result.devMode) {
    return { sent: false, devVerifyUrl: verifyUrl };
  }

  if (!result.sent) {
    return { sent: false, error: result.error ?? "Send failed" };
  }

  await prisma.emailVerificationReminder.create({
    data: { userId, kind },
  });

  await Promise.allSettled([
    import("@/lib/analytics/persist").then(({ persistAnalyticsEvent }) =>
      persistAnalyticsEvent("verification_reminder_sent", userId, { kind })
    ),
  ]);

  return { sent: true };
}

export async function runScheduledVerificationReminders() {
  const now = new Date();
  const oneHourAgo = subHours(now, 1);
  const twentyFourHoursAgo = subHours(now, 24);
  const sevenDaysAgo = subDays(now, 7);

  const candidates = await prisma.user.findMany({
    where: {
      emailVerified: null,
      password: { not: null },
      createdAt: { gte: sevenDaysAgo, lte: oneHourAgo },
    },
    select: { id: true, createdAt: true, name: true, email: true },
  });

  let sent1h = 0;
  let sent24h = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of candidates) {
    let kind: VerificationReminderKind | null = null;
    if (user.createdAt <= twentyFourHoursAgo) {
      kind = "auto_24h";
    } else if (user.createdAt <= oneHourAgo) {
      kind = "auto_1h";
    }

    if (!kind) continue;

    const result = await sendVerificationReminderToUser(user.id, kind);
    if (result.sent) {
      if (kind === "auto_1h") sent1h += 1;
      else sent24h += 1;
    } else if (result.skipped) {
      skipped += 1;
    } else {
      errors += 1;
    }
  }

  return { sent1h, sent24h, skipped, errors, checked: candidates.length };
}

export async function sendFounderVerificationReminders(opts?: {
  userIds?: string[];
  dryRun?: boolean;
}) {
  const founderOpts = { skipBotCheck: true, skipCooldown: true };

  const users =
    opts?.userIds?.length ?
      await prisma.user.findMany({
        where: { id: { in: opts.userIds } },
        select: { id: true, email: true, name: true, emailVerified: true, password: true },
      })
    : await prisma.user.findMany({
        where: {
          emailVerified: null,
          password: { not: null },
        },
        select: { id: true, email: true, name: true, emailVerified: true, password: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

  const results: Array<{ email: string; status: string }> = [];
  const summary: Record<string, number> = {};
  let sent = 0;

  const bump = (status: string) => {
    summary[status] = (summary[status] ?? 0) + 1;
  };

  for (const user of users) {
    if (opts?.dryRun) {
      if (user.emailVerified) {
        results.push({ email: user.email, status: "already_verified" });
        bump("already_verified");
      } else if (!user.password) {
        results.push({ email: user.email, status: "oauth_skip" });
        bump("oauth_skip");
      } else {
        results.push({ email: user.email, status: "would_send" });
        bump("would_send");
      }
      continue;
    }

    const result = await sendVerificationReminderToUser(user.id, "founder_batch", founderOpts);
    if (result.sent) {
      sent += 1;
      results.push({ email: user.email, status: "sent" });
      bump("sent");
    } else {
      const status = result.skipped ?? result.error ?? "failed";
      results.push({ email: user.email, status });
      bump(status);
    }
  }

  return { sent, total: users.length, results, summary };
}

export async function listUnverifiedUsersForReminders(limit = 50) {
  return prisma.user.findMany({
    where: {
      emailVerified: null,
      password: { not: null },
      createdAt: { lt: subHours(new Date(), 1) },
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      referralSource: true,
      emailVerificationReminders: {
        orderBy: { sentAt: "desc" },
        take: 1,
        select: { sentAt: true, kind: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
