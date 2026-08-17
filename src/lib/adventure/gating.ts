import "server-only";

import { getUserPlan } from "@/lib/ai/usage";
import { prisma } from "@/lib/db";
import { FREE_POSTER_LIMIT, FREE_POSTER_THEMES } from "@/lib/posters/constants";
import type { AdventureFeatures } from "@/types/adventure-journey";
import type { AdventureFormat, PosterLayout, PosterTheme } from "@prisma/client";

export async function getPosterFeatures(userId: string): Promise<AdventureFeatures> {
  const plan = await getUserPlan(userId);
  const isPremium = plan === "PREMIUM" || plan === "FAMILY";

  const count = await prisma.routinePoster.count({
    where: { userId, deletedAt: null },
  });

  return {
    isPremium,
    unlimitedAdventures: isPremium,
    aiPersonalization: isPremium,
    unlimitedThemes: isPremium,
    familyVoiceStory: isPremium,
    familyVoiceSong: isPremium,
    adventureLibrary: isPremium,
    adventuresRemaining: isPremium ? null : Math.max(0, FREE_POSTER_LIMIT - count),
    // legacy aliases
    unlimitedPosters: isPremium,
    postersRemaining: isPremium ? null : Math.max(0, FREE_POSTER_LIMIT - count),
    weeklyPlannerLayout: isPremium,
    familyVoiceQr: isPremium,
  } as AdventureFeatures;
}

export async function assertCanCreatePoster(userId: string): Promise<AdventureFeatures> {
  const features = await getPosterFeatures(userId);
  if (features.unlimitedAdventures) return features;
  if ((features.adventuresRemaining ?? 0) <= 0) {
    throw new Error(
      `Free plan includes ${FREE_POSTER_LIMIT} adventure journey. Upgrade to Premium for unlimited adventures.`
    );
  }
  return features;
}

export async function assertCanUseAiPoster(userId: string): Promise<void> {
  const features = await getPosterFeatures(userId);
  if (!features.aiPersonalization) {
    throw new Error("AI personalised adventures are a Premium feature. Upgrade or use a standard template.");
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

export function assertFormatAllowed(format: AdventureFormat, isPremium: boolean): void {
  if (!isPremium && (format === "COMIC_STRIP" || format === "ADVENTURE_CARDS")) {
    throw new Error("This format is Premium. Upgrade to unlock Comic Strip and Adventure Cards.");
  }
}
