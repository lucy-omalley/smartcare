import "server-only";

import type { SubscriptionPlan } from "@prisma/client";
import { getUserPlan } from "@/lib/ai/usage";
import { PLAN_LIMITS } from "@/lib/ai/types";
import { prisma } from "@/lib/db";

export const FREE_FAMILY_STORIES_PER_MONTH = 3;
export const PREMIUM_STORY_LENGTHS = [2, 5, 10, 15] as const;
export const FREE_STORY_LENGTHS = [2, 5] as const;

export type StorytimePlanFeatures = {
  plan: SubscriptionPlan;
  isPremium: boolean;
  familyVoiceEnabled: boolean;
  unlimitedStories: boolean;
  storyHistoryEnabled: boolean;
  weeklyBookEnabled: boolean;
  allowedLengths: readonly number[];
  storiesRemainingThisMonth: number | null;
};

async function ensureQuota(userId: string) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const existing = await prisma.userUsageQuota.findUnique({ where: { userId } });
  if (!existing) {
    return prisma.userUsageQuota.create({
      data: {
        userId,
        lastDailyReset: new Date(),
        lastMonthlyReset: monthStart,
      },
    });
  }
  if (existing.lastMonthlyReset.getTime() !== monthStart.getTime()) {
    return prisma.userUsageQuota.update({
      where: { userId },
      data: { familyStoriesThisMonth: 0, lastMonthlyReset: monthStart },
    });
  }
  return existing;
}

export async function getStorytimeFeatures(userId: string): Promise<StorytimePlanFeatures> {
  const plan = await getUserPlan(userId);
  const isPremium = plan === "PREMIUM" || plan === "FAMILY";
  const quota = await ensureQuota(userId);

  return {
    plan,
    isPremium,
    familyVoiceEnabled: isPremium,
    unlimitedStories: isPremium,
    storyHistoryEnabled: isPremium,
    weeklyBookEnabled: isPremium,
    allowedLengths: isPremium ? PREMIUM_STORY_LENGTHS : FREE_STORY_LENGTHS,
    storiesRemainingThisMonth: isPremium
      ? null
      : Math.max(0, FREE_FAMILY_STORIES_PER_MONTH - quota.familyStoriesThisMonth),
  };
}

export async function assertCanGenerateFamilyStory(userId: string): Promise<StorytimePlanFeatures> {
  const features = await getStorytimeFeatures(userId);
  if (features.unlimitedStories) return features;
  if ((features.storiesRemainingThisMonth ?? 0) <= 0) {
    throw new Error("Free plan includes 3 AI stories per month. Upgrade to Premium for unlimited Family Voice Storytime.");
  }
  return features;
}

export async function assertCanUseFamilyVoice(userId: string): Promise<void> {
  const features = await getStorytimeFeatures(userId);
  if (!features.familyVoiceEnabled) {
    throw new Error("Family Voice Storytime is a Premium feature. Upgrade to record and play stories in your voice.");
  }
}

export async function recordFamilyStoryGenerated(userId: string): Promise<void> {
  await ensureQuota(userId);
  await prisma.userUsageQuota.update({
    where: { userId },
    data: {
      familyStoriesThisMonth: { increment: 1 },
      generationsThisMonth: { increment: 1 },
    },
  });
}

export function assertStoryLengthAllowed(lengthMinutes: number, features: StorytimePlanFeatures): void {
  if (!features.allowedLengths.includes(lengthMinutes as (typeof PREMIUM_STORY_LENGTHS)[number])) {
    throw new Error(
      features.isPremium
        ? "Invalid story length."
        : "Longer stories are available on Premium. Choose 2 or 5 minutes, or upgrade."
    );
  }
}
