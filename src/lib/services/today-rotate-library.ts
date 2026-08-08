import "server-only";

import { prisma } from "@/lib/db";
import type { BriefProfile } from "@/lib/daily-brief-context";
import { enrichProfileWithChildAge } from "@/lib/child-age";
import {
  buildPlanContext,
  fetchAllKnowledgeRotatePools,
  type RotateLibraryPoolsShape,
} from "@/lib/knowledge/repository";
import { fetchWeatherForLocation } from "@/lib/services/weather";

export type RotateLibraryPools = RotateLibraryPoolsShape;

/** Preload knowledge-base alternates for fast Try another — no AI calls. */
export async function ensureRotateLibrary(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      childNickname: true,
      childAge: true,
      childBirthday: true,
      childInterests: true,
      foodPreferences: true,
      foodDislikes: true,
      location: true,
      priorityGoal: true,
      parentingGoals: true,
    },
  });
  const profile = enrichProfileWithChildAge((user ?? {}) as BriefProfile) ?? ({} as BriefProfile);
  const weather = profile.location ? await fetchWeatherForLocation(profile.location) : null;
  const ctx = buildPlanContext(profile, weather?.weather ?? null);
  const pools = await fetchAllKnowledgeRotatePools(profile, ctx);

  if (!pools.recipes.length && !pools.play.length) return;

  await prisma.userRotateLibrary.upsert({
    where: { userId },
    create: {
      userId,
      profileHash: `kb-${ctx.ageMonths ?? "any"}`,
      recipes: pools.recipes as object[],
      play: pools.play as object[],
      stories: pools.stories as object[],
      language: pools.language as object[],
    },
    update: {
      profileHash: `kb-${ctx.ageMonths ?? "any"}`,
      recipes: pools.recipes as object[],
      play: pools.play as object[],
      stories: pools.stories as object[],
      language: pools.language as object[],
    },
  });
}

export async function getRotateLibraryPools(
  userId: string,
  profile: BriefProfile
): Promise<RotateLibraryPools> {
  const record = await prisma.userRotateLibrary.findUnique({ where: { userId } }).catch(() => null);
  if (record) {
    return {
      recipes: Array.isArray(record.recipes) ? (record.recipes as unknown as RotateLibraryPools["recipes"]) : [],
      play: Array.isArray(record.play) ? (record.play as unknown as RotateLibraryPools["play"]) : [],
      stories: Array.isArray(record.stories) ? (record.stories as unknown as RotateLibraryPools["stories"]) : [],
      language: Array.isArray(record.language) ? (record.language as unknown as RotateLibraryPools["language"]) : [],
    };
  }

  const weather = profile.location ? await fetchWeatherForLocation(profile.location) : null;
  const ctx = buildPlanContext(profile, weather?.weather ?? null);
  return fetchAllKnowledgeRotatePools(profile, ctx);
}

export async function invalidateRotateLibrary(userId: string): Promise<void> {
  await prisma.userRotateLibrary.deleteMany({ where: { userId } }).catch(() => {});
}

const inflight = new Map<string, Promise<void>>();

export function warmRotateLibraryInBackground(userId: string): void {
  if (inflight.has(userId)) return;
  const task = ensureRotateLibrary(userId)
    .catch((err) => console.warn("Knowledge rotate library warm failed:", err))
    .finally(() => inflight.delete(userId));
  inflight.set(userId, task);
}

export function scheduleRotateLibraryRefill(_userId: string, _section: string): void {
  // Knowledge pool is static — no AI refill needed
}
