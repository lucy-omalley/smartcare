import type {
  DailyBriefDevelopment,
  DailyBriefPlay,
  DailyBriefRecipe,
  DailyBriefStory,
} from "@/types/daily-brief";
import type { PlanSignals } from "./types";
import {
  briefPlayToScorable,
  briefRecipeToScorable,
  briefStoryToScorable,
  briefTipToScorable,
  playItemKey,
  recipeItemKey,
  storyItemKey,
  tipItemKey,
} from "./adapters/brief-to-scorable";
import { buildRecommendationReason } from "./explain/build-reason";
import {
  rankScored,
  scoreActivity,
  scoreRecipe,
  scoreStory,
  scoreTip,
} from "./scoring/score-candidate";

export type RotateSection = "recipe" | "play" | "story" | "language";

interface RankedRotateItem<T> {
  item: T;
  key: string;
  reason: string;
  total: number;
}

function pickFromRanked<T>(
  ranked: RankedRotateItem<T>[],
  excludeKey: string,
  rotationIndex: number
): RankedRotateItem<T> | undefined {
  const withoutCurrent = ranked.filter((entry) => entry.key !== excludeKey);
  const pool = withoutCurrent.length > 0 ? withoutCurrent : ranked;
  if (!pool.length) return undefined;
  const idx = Math.min(Math.max(rotationIndex, 0), pool.length - 1);
  return pool[idx];
}

function rankRecipes(
  signals: PlanSignals,
  pool: Omit<DailyBriefRecipe, "imageData" | "sampleLinks" | "fromFridge">[]
): RankedRotateItem<Omit<DailyBriefRecipe, "imageData" | "sampleLinks" | "fromFridge">>[] {
  const scored = pool.map((item) => {
    const scorable = briefRecipeToScorable(item as DailyBriefRecipe);
    return { item, key: recipeItemKey(item), scored: scoreRecipe(signals, scorable) };
  });
  return rankScored(scored.map((s) => s.scored)).map((top) => {
    const match = scored.find((s) => s.scored.item.slug === top.item.slug)!;
    return {
      item: match.item,
      key: match.key,
      total: top.total,
      reason: buildRecommendationReason(
        top,
        match.item.whyThisMeal ?? "Recommended because this balanced meal suits your child's stage."
      ),
    };
  });
}

function rankPlay(
  signals: PlanSignals,
  pool: Omit<DailyBriefPlay, "imageData">[]
): RankedRotateItem<Omit<DailyBriefPlay, "imageData">>[] {
  const scored = pool.map((item) => {
    const scorable = briefPlayToScorable(item as DailyBriefPlay);
    return { item, key: playItemKey(item), scored: scoreActivity(signals, scorable) };
  });
  return rankScored(scored.map((s) => s.scored)).map((top) => {
    const match = scored.find((s) => s.scored.item.slug === top.item.slug)!;
    return {
      item: match.item,
      key: match.key,
      total: top.total,
      reason: buildRecommendationReason(
        top,
        match.item.reason ?? "Recommended because playful activities support development."
      ),
    };
  });
}

function rankStories(
  signals: PlanSignals,
  pool: Omit<DailyBriefStory, "illustrationData">[]
): RankedRotateItem<Omit<DailyBriefStory, "illustrationData">>[] {
  const scored = pool.map((item) => {
    const scorable = briefStoryToScorable(item as DailyBriefStory);
    return { item, key: storyItemKey(item), scored: scoreStory(signals, scorable) };
  });
  return rankScored(scored.map((s) => s.scored)).map((top) => {
    const match = scored.find((s) => s.scored.item.slug === top.item.slug)!;
    return {
      item: match.item,
      key: match.key,
      total: top.total,
      reason: buildRecommendationReason(
        top,
        match.item.reason ?? "Recommended because a gentle story helps wind down at bedtime."
      ),
    };
  });
}

function rankLanguage(
  signals: PlanSignals,
  pool: DailyBriefDevelopment[]
): RankedRotateItem<DailyBriefDevelopment>[] {
  const scored = pool.map((item) => {
    const scorable = briefTipToScorable(item);
    return { item, key: tipItemKey(item), scored: scoreTip(signals, scorable) };
  });
  return rankScored(scored.map((s) => s.scored)).map((top) => {
    const match = scored.find((s) => s.scored.item.slug === top.item.slug)!;
    return {
      item: match.item,
      key: match.key,
      total: top.total,
      reason: buildRecommendationReason(
        top,
        match.item.reason ?? "Recommended because this tip supports language at this stage."
      ),
    };
  });
}

export function pickRotateRecipe(
  signals: PlanSignals,
  pool: Omit<DailyBriefRecipe, "imageData" | "sampleLinks" | "fromFridge">[],
  current: DailyBriefRecipe,
  rotationIndex: number
): { item: Omit<DailyBriefRecipe, "imageData" | "sampleLinks" | "fromFridge">; reason: string } | null {
  const ranked = rankRecipes(signals, pool);
  const pick = pickFromRanked(ranked, recipeItemKey(current), rotationIndex);
  return pick ? { item: pick.item, reason: pick.reason } : null;
}

export function pickRotatePlay(
  signals: PlanSignals,
  pool: Omit<DailyBriefPlay, "imageData">[],
  current: DailyBriefPlay,
  rotationIndex: number
): { item: Omit<DailyBriefPlay, "imageData">; reason: string } | null {
  const ranked = rankPlay(signals, pool);
  const pick = pickFromRanked(ranked, playItemKey(current), rotationIndex);
  return pick ? { item: pick.item, reason: pick.reason } : null;
}

export function pickRotateStory(
  signals: PlanSignals,
  pool: Omit<DailyBriefStory, "illustrationData">[],
  current: DailyBriefStory,
  rotationIndex: number
): { item: Omit<DailyBriefStory, "illustrationData">; reason: string } | null {
  const ranked = rankStories(signals, pool);
  const pick = pickFromRanked(ranked, storyItemKey(current), rotationIndex);
  return pick ? { item: pick.item, reason: pick.reason } : null;
}

export function pickRotateLanguage(
  signals: PlanSignals,
  pool: DailyBriefDevelopment[],
  current: DailyBriefDevelopment,
  rotationIndex: number
): { item: DailyBriefDevelopment; reason: string } | null {
  const ranked = rankLanguage(signals, pool);
  const pick = pickFromRanked(ranked, tipItemKey(current), rotationIndex);
  return pick ? { item: pick.item, reason: pick.reason } : null;
}

/** Admin debug — full ranked list for a rotate section */
export function rankRotateSection<T extends DailyBriefRecipe | DailyBriefPlay | DailyBriefStory | DailyBriefDevelopment>(
  section: RotateSection,
  signals: PlanSignals,
  pool: T[]
): RankedRotateItem<T>[] {
  if (section === "recipe") return rankRecipes(signals, pool as DailyBriefRecipe[]) as RankedRotateItem<T>[];
  if (section === "play") return rankPlay(signals, pool as DailyBriefPlay[]) as RankedRotateItem<T>[];
  if (section === "story") return rankStories(signals, pool as DailyBriefStory[]) as RankedRotateItem<T>[];
  return rankLanguage(signals, pool as DailyBriefDevelopment[]) as RankedRotateItem<T>[];
}
