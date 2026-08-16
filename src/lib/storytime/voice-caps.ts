import "server-only";

import type { SubscriptionPlan } from "@prisma/client";
import { hasUnlimitedUsage } from "@/lib/admin-auth";
import { getUserPlan } from "@/lib/ai/usage";
import { isBetaTrialActive } from "@/lib/beta-trial";
import { prisma } from "@/lib/db";
import {
  VOICE_USAGE_LIMITS,
  type VoiceUsageLimits,
  type VoiceUsageSnapshot,
  type VoiceUsageTier,
} from "@/types/voice-usage";

export { VOICE_USAGE_LIMITS };
export type { VoiceUsageLimits, VoiceUsageSnapshot, VoiceUsageTier };

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function ensureVoiceUsageQuota(userId: string) {
  const monthStart = startOfMonth();
  const existing = await prisma.userUsageQuota.findUnique({ where: { userId } });
  if (!existing) {
    return prisma.userUsageQuota.create({
      data: {
        userId,
        lastDailyReset: monthStart,
        lastMonthlyReset: monthStart,
      },
    });
  }

  if (existing.lastMonthlyReset.getTime() !== monthStart.getTime()) {
    return prisma.userUsageQuota.update({
      where: { userId },
      data: {
        familyStoriesThisMonth: 0,
        generationsThisMonth: 0,
        familyVoiceGenerationsThisMonth: 0,
        voiceClonesThisMonth: 0,
        lastMonthlyReset: monthStart,
      },
    });
  }

  return existing;
}

async function resolveVoiceUsageTier(userId: string): Promise<VoiceUsageTier> {
  if (await hasUnlimitedUsage(userId)) return "unlimited";

  const plan: SubscriptionPlan = await getUserPlan(userId);
  if (plan !== "PREMIUM" && plan !== "FAMILY") return "free";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planTier: true, betaTrialEndsAt: true },
  });
  if (
    user &&
    isBetaTrialActive(user) &&
    user.planTier !== "PREMIUM" &&
    user.planTier !== "FAMILY"
  ) {
    return "beta";
  }

  return "premium";
}

function limitsForTier(tier: VoiceUsageTier): VoiceUsageLimits {
  if (tier === "unlimited") return VOICE_USAGE_LIMITS.premium;
  return VOICE_USAGE_LIMITS[tier];
}

function remaining(used: number, max: number): number {
  return Math.max(0, max - used);
}

export async function getVoiceUsageSnapshot(userId: string): Promise<VoiceUsageSnapshot> {
  const tier = await resolveVoiceUsageTier(userId);
  const limits = limitsForTier(tier);
  const [quota, voiceProfilesUsed] = await Promise.all([
    ensureVoiceUsageQuota(userId),
    prisma.voiceProfile.count({ where: { userId, deletedAt: null } }),
  ]);

  const unlimited = tier === "unlimited";

  return {
    tier,
    limits,
    voiceProfilesUsed,
    voiceClonesUsedThisMonth: quota.voiceClonesThisMonth,
    familyNarrationsUsedThisMonth: quota.familyVoiceGenerationsThisMonth,
    voiceProfilesRemaining: unlimited
      ? null
      : remaining(voiceProfilesUsed, limits.maxVoiceProfiles),
    voiceClonesRemainingThisMonth: unlimited
      ? null
      : remaining(quota.voiceClonesThisMonth, limits.voiceClonesPerMonth),
    familyNarrationsRemainingThisMonth: unlimited
      ? null
      : remaining(quota.familyVoiceGenerationsThisMonth, limits.familyNarrationsPerMonth),
  };
}

export async function assertCanCreateVoiceProfile(userId: string): Promise<void> {
  const snapshot = await getVoiceUsageSnapshot(userId);
  if (snapshot.tier === "free") {
    throw new Error("Family Voice Storytime is a Premium feature. Upgrade to record and play stories in your voice.");
  }
  if (snapshot.tier === "unlimited") return;

  if (snapshot.voiceProfilesUsed >= snapshot.limits.maxVoiceProfiles) {
    throw new Error(
      `You can save up to ${snapshot.limits.maxVoiceProfiles} family voices. Delete one in Voice library to add another.`
    );
  }
}

export async function assertCanCloneVoice(userId: string): Promise<void> {
  const snapshot = await getVoiceUsageSnapshot(userId);
  if (snapshot.tier === "free") {
    throw new Error("Family Voice Storytime is a Premium feature. Upgrade to record and play stories in your voice.");
  }
  if (snapshot.tier === "unlimited") return;

  if ((snapshot.voiceClonesRemainingThisMonth ?? 0) <= 0) {
    const resetHint =
      snapshot.tier === "beta"
        ? "Beta includes 1 voice clone per month."
        : `Premium includes ${snapshot.limits.voiceClonesPerMonth} voice clones per month.`;
    throw new Error(
      `Monthly voice clone limit reached. ${resetHint} Replays of existing stories are still free — limits reset next month.`
    );
  }
}

export async function assertCanGenerateFamilyNarration(userId: string): Promise<void> {
  const snapshot = await getVoiceUsageSnapshot(userId);
  if (snapshot.tier === "free") {
    throw new Error("Family Voice Storytime is a Premium feature. Upgrade to play stories in your voice.");
  }
  if (snapshot.tier === "unlimited") return;

  if ((snapshot.familyNarrationsRemainingThisMonth ?? 0) <= 0) {
    const limit = snapshot.limits.familyNarrationsPerMonth;
    throw new Error(
      `Monthly family-voice narration limit reached (${limit}/month). Replays of stories you've already heard in your voice are still free. New story + voice combinations reset next month.`
    );
  }
}

export async function recordVoiceClone(userId: string): Promise<void> {
  if (await hasUnlimitedUsage(userId)) return;
  const monthStart = startOfMonth();
  await prisma.userUsageQuota.upsert({
    where: { userId },
    create: {
      userId,
      lastDailyReset: monthStart,
      lastMonthlyReset: monthStart,
      voiceClonesThisMonth: 1,
    },
    update: {
      voiceClonesThisMonth: { increment: 1 },
    },
  });
}

export async function recordFamilyVoiceGeneration(userId: string): Promise<void> {
  if (await hasUnlimitedUsage(userId)) return;
  const monthStart = startOfMonth();
  await prisma.userUsageQuota.upsert({
    where: { userId },
    create: {
      userId,
      lastDailyReset: monthStart,
      lastMonthlyReset: monthStart,
      familyVoiceGenerationsThisMonth: 1,
    },
    update: {
      familyVoiceGenerationsThisMonth: { increment: 1 },
    },
  });
}
