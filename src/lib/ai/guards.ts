import "server-only";

import { prisma } from "@/lib/db";
import { isEmailVerified } from "@/lib/auth/email-verification";

export const AI_UNAVAILABLE_MESSAGE =
  "AI generation is temporarily unavailable. Please try again later.";

export class AiDisabledError extends Error {
  constructor(message = AI_UNAVAILABLE_MESSAGE) {
    super(message);
    this.name = "AiDisabledError";
  }
}

export class EmailNotVerifiedError extends Error {
  constructor(
    message = "Please verify your email to use AI features. Check your inbox or resend from the verification page."
  ) {
    super(message);
    this.name = "EmailNotVerifiedError";
  }
}

export function isAiGenerationEnabled(): boolean {
  const value = process.env.AI_GENERATION_ENABLED?.trim().toLowerCase();
  if (value === "false" || value === "0" || value === "off") return false;
  return true;
}

function parseDailyCostLimit(): number | null {
  const raw = process.env.AI_DAILY_COST_LIMIT?.trim();
  if (!raw) return null;
  const limit = Number(raw);
  return Number.isFinite(limit) && limit > 0 ? limit : null;
}

export async function assertDailyCostBudget(): Promise<void> {
  const limit = parseDailyCostLimit();
  if (!limit) return;

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const aggregate = await prisma.aIUsageLog.aggregate({
    where: { createdAt: { gte: startOfDay }, cacheHit: false },
    _sum: { estimatedCostUsd: true },
  });

  const spent = aggregate._sum.estimatedCostUsd ?? 0;
  if (spent >= limit) {
    throw new AiDisabledError(AI_UNAVAILABLE_MESSAGE);
  }
}

export async function assertAiGenerationEnabled(): Promise<void> {
  if (!isAiGenerationEnabled()) {
    throw new AiDisabledError();
  }
  await assertDailyCostBudget();
}

export async function assertUserCanUseAi(userId: string): Promise<void> {
  await assertAiGenerationEnabled();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true, isAdmin: true },
  });

  if (!user) {
    throw new EmailNotVerifiedError("Account not found.");
  }

  if (!isEmailVerified(user)) {
    throw new EmailNotVerifiedError();
  }
}
