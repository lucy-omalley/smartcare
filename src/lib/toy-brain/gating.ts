import "server-only";

import { getUserPlan } from "@/lib/ai/usage";
import { prisma } from "@/lib/db";
import {
  FREE_ACTIVITIES_PER_TOY,
  FREE_TOY_SCANS_PER_MONTH,
  PREMIUM_ACTIVITIES_PER_TOY,
} from "@/lib/toy-brain/constants";
import type { ToyBrainFeatures } from "@/types/toy-brain";

async function getOrCreateQuota(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  let quota = await prisma.userUsageQuota.findUnique({ where: { userId } });
  if (!quota) {
    quota = await prisma.userUsageQuota.create({
      data: {
        userId,
        lastDailyReset: today,
        lastMonthlyReset: monthStart,
      },
    });
  }

  if (quota.lastMonthlyReset < monthStart) {
    quota = await prisma.userUsageQuota.update({
      where: { userId },
      data: {
        toyScansThisMonth: 0,
        lastMonthlyReset: monthStart,
      },
    });
  }

  return quota;
}

export async function getToyBrainFeatures(userId: string): Promise<ToyBrainFeatures> {
  const plan = await getUserPlan(userId);
  const isPremium = plan === "PREMIUM" || plan === "FAMILY";
  const quota = await getOrCreateQuota(userId);
  const remaining = Math.max(0, FREE_TOY_SCANS_PER_MONTH - quota.toyScansThisMonth);

  return {
    isPremium,
    unlimitedScans: isPremium,
    unlimitedActivities: isPremium,
    aiPersonalization: isPremium,
    todayPlanIntegration: isPremium,
    printableCards: isPremium,
    scansRemaining: isPremium ? null : remaining,
    maxActivitiesPerToy: isPremium ? null : FREE_ACTIVITIES_PER_TOY,
  };
}

export async function assertCanScanToy(userId: string): Promise<ToyBrainFeatures> {
  const features = await getToyBrainFeatures(userId);
  if (features.unlimitedScans) return features;
  if ((features.scansRemaining ?? 0) <= 0) {
    throw new Error(
      `Free plan includes ${FREE_TOY_SCANS_PER_MONTH} toy scans per month. Upgrade to Premium for unlimited scans.`
    );
  }
  return features;
}

export async function recordToyScan(userId: string): Promise<void> {
  const features = await getToyBrainFeatures(userId);
  if (features.unlimitedScans) return;
  await getOrCreateQuota(userId);
  await prisma.userUsageQuota.update({
    where: { userId },
    data: { toyScansThisMonth: { increment: 1 } },
  });
}

export function activityLimitForPlan(isPremium: boolean): number {
  return isPremium ? PREMIUM_ACTIVITIES_PER_TOY : FREE_ACTIVITIES_PER_TOY;
}

export async function assertCanUseAiToyBrain(userId: string): Promise<void> {
  const features = await getToyBrainFeatures(userId);
  if (!features.aiPersonalization) {
    throw new Error("AI personalised play ideas are a Premium feature. Upgrade for custom activities.");
  }
}
