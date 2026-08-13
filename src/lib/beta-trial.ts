import "server-only";

import type { SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/db";

export const BETA_TRIAL_DAYS = 30;

export function isBetaTrialActive(user: { betaTrialEndsAt: Date | null }): boolean {
  if (!user.betaTrialEndsAt) return false;
  return user.betaTrialEndsAt.getTime() > Date.now();
}

export function effectivePlanTier(user: {
  betaTrialEndsAt: Date | null;
  planTier: SubscriptionPlan;
}): SubscriptionPlan {
  if (user.planTier === "PREMIUM" || user.planTier === "FAMILY") return user.planTier;
  if (isBetaTrialActive(user)) return "PREMIUM";
  return user.planTier ?? "FREE";
}

export async function grantBetaTrial(userId: string): Promise<Date> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { betaTrialEndsAt: true, planTier: true },
  });

  if (existing?.betaTrialEndsAt && existing.betaTrialEndsAt.getTime() > Date.now()) {
    return existing.betaTrialEndsAt;
  }

  const ends = new Date();
  ends.setUTCDate(ends.getUTCDate() + BETA_TRIAL_DAYS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      betaTrialEndsAt: ends,
      subscriptionStatus: "TRIALING",
    },
  });

  return ends;
}

export async function getBetaTrialStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planTier: true,
      betaTrialEndsAt: true,
      subscriptionStatus: true,
      subscriptionPeriodEnd: true,
    },
  });

  if (!user) return null;

  const trialActive = isBetaTrialActive(user);
  const effective = effectivePlanTier(user);

  return {
    planTier: user.planTier,
    effectivePlanTier: effective,
    betaTrialActive: trialActive,
    betaTrialEndsAt: user.betaTrialEndsAt?.toISOString() ?? null,
    daysRemaining: user.betaTrialEndsAt
      ? Math.max(0, Math.ceil((user.betaTrialEndsAt.getTime() - Date.now()) / 86_400_000))
      : 0,
    subscriptionStatus: user.subscriptionStatus,
  };
}
