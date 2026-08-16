import "server-only";

import { getUserPlan } from "@/lib/ai/usage";
import { prisma } from "@/lib/db";
import { FREE_ROUTINE_LIMIT } from "@/lib/routines/constants";
import type { RoutineFeatures } from "@/types/visual-routine";

export async function getRoutineFeatures(userId: string): Promise<RoutineFeatures> {
  const plan = await getUserPlan(userId);
  const isPremium = plan === "PREMIUM" || plan === "FAMILY";

  const count = await prisma.visualRoutine.count({
    where: { userId, deletedAt: null },
  });

  return {
    isPremium,
    unlimitedRoutines: isPremium,
    aiPersonalization: isPremium,
    familyVoiceEnabled: isPremium,
    advancedAnalytics: isPremium,
    routinesRemaining: isPremium ? null : Math.max(0, FREE_ROUTINE_LIMIT - count),
  };
}

export async function assertCanCreateRoutine(userId: string): Promise<RoutineFeatures> {
  const features = await getRoutineFeatures(userId);
  if (features.unlimitedRoutines) return features;
  if ((features.routinesRemaining ?? 0) <= 0) {
    throw new Error(
      `Free plan includes ${FREE_ROUTINE_LIMIT} visual routines. Upgrade to Premium for unlimited AI routines.`
    );
  }
  return features;
}

export async function assertCanUseAiRoutine(userId: string): Promise<void> {
  const features = await getRoutineFeatures(userId);
  if (!features.aiPersonalization) {
    throw new Error("AI personalised routines are a Premium feature. Upgrade or use a standard template.");
  }
}
