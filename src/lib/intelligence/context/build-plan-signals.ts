import type { BriefProfile } from "@/lib/daily-brief-context";
import { getDevelopmentStage } from "@/lib/child-development";
import { resolveChildAgeDisplay } from "@/lib/child-age";
import type { PlanContext } from "@/lib/knowledge/repository";
import type { AIMemorySignals } from "@/lib/services/today-recommendation-engine";
import type { PlanHistory, PlanSignals } from "../types";
import { normalizeTokens } from "../scoring/utils";

export function buildPlanSignals(
  profile: BriefProfile,
  ctx: PlanContext,
  memory: AIMemorySignals,
  date = new Date(),
  history: PlanHistory = {}
): PlanSignals {
  const display = resolveChildAgeDisplay(profile);
  const developmentStage = getDevelopmentStage(display ?? profile.childAge, profile.childBirthday);

  return {
    profile,
    ctx,
    memory,
    developmentStage,
    interests: normalizeTokens([
      ...(profile.childInterests ?? []),
      ...(profile.favouriteThemes ?? []),
      ...(profile.favouriteToys ?? []),
    ]),
    goals: normalizeTokens([
      ...(profile.parentingGoals ?? []),
      ...(profile.parentingGoal ? [profile.parentingGoal] : []),
      ...(profile.priorityGoal ? [profile.priorityGoal] : []),
    ]),
    challenges: normalizeTokens(profile.currentChallenges),
    favouriteFoods: normalizeTokens([
      ...(profile.favouriteFoods ?? []),
      ...(profile.foodPreferences ?? []),
    ]),
    foodDislikes: normalizeTokens(profile.foodDislikes),
    previousRecipeSlugs: history.previousRecipeSlugs ?? [],
    previousActivitySlugs: history.previousActivitySlugs ?? [],
    previousStorySlugs: history.previousStorySlugs ?? [],
    weekday: date.getDay(),
    isWeekend: ctx.isWeekend,
    isRainy: ctx.isRainy,
    isSunny: ctx.isSunny,
    weather: ctx.weather,
  };
}
