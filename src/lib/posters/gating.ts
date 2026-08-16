import "server-only";

import { getUserPlan } from "@/lib/ai/usage";
import { prisma } from "@/lib/db";
import { FREE_POSTER_LIMIT, FREE_POSTER_THEMES } from "@/lib/posters/constants";
import type { PosterFeatures } from "@/types/routine-poster";
import type { PosterLayout, PosterTheme } from "@prisma/client";

export async function getPosterFeatures(userId: string): Promise<PosterFeatures> {
  const plan = await getUserPlan(userId);
  const isPremium = plan === "PREMIUM" || plan === "FAMILY";

  const count = await prisma.routinePoster.count({
    where: { userId, deletedAt: null },
  });

  return {
    isPremium,
    unlimitedPosters: isPremium,
    aiPersonalization: isPremium,
    unlimitedThemes: isPremium,
    weeklyPlannerLayout: isPremium,
    familyVoiceQr: isPremium,
    postersRemaining: isPremium ? null : Math.max(0, FREE_POSTER_LIMIT - count),
  };
}

export async function assertCanCreatePoster(userId: string): Promise<PosterFeatures> {
  const features = await getPosterFeatures(userId);
  if (features.unlimitedPosters) return features;
  if ((features.postersRemaining ?? 0) <= 0) {
    throw new Error(
      `Free plan includes ${FREE_POSTER_LIMIT} printable routine poster. Upgrade to Premium for unlimited posters.`
    );
  }
  return features;
}

export async function assertCanUseAiPoster(userId: string): Promise<void> {
  const features = await getPosterFeatures(userId);
  if (!features.aiPersonalization) {
    throw new Error("AI personalised posters are a Premium feature. Upgrade or use a standard template.");
  }
}

export function assertThemeAllowed(theme: PosterTheme, isPremium: boolean): void {
  if (isPremium || FREE_POSTER_THEMES.includes(theme)) return;
  throw new Error("This theme is Premium. Upgrade to unlock all themes.");
}

export function assertLayoutAllowed(layout: PosterLayout, isPremium: boolean): void {
  if (!isPremium && (layout === "A3_POSTER" || layout === "WEEKLY_PLANNER")) {
    throw new Error("This layout is Premium. Upgrade to unlock A3 and Weekly Planner formats.");
  }
}
