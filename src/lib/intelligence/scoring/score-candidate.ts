import type { CandidateKind, PlanSignals, ScoreFactor, ScoredCandidate } from "../types";
import { SCORING_WEIGHTS } from "./weights";
import { moodFitRaw, nearbyEventRaw } from "./mood-nearby";
import { ageFitNormalized, haystack, normalizeTokens, stageDomainBoost, tokenMatchScore } from "./utils";

function factor(id: string, label: string, weight: number, raw: number): ScoreFactor {
  const clamped = Math.max(0, Math.min(1, raw));
  return { id, label, weight, raw: clamped, weighted: clamped * weight };
}

function buildFactors(
  signals: PlanSignals,
  text: string,
  category: string,
  minAgeMonths: number,
  maxAgeMonths: number,
  historyTitles: string[],
  kind: CandidateKind,
  weatherOpts?: { indoorOutdoor?: string; rainyDay?: boolean; sunnyDay?: boolean }
): ScoreFactor[] {
  const { ctx, interests, goals, challenges, developmentStage } = signals;

  const ageRaw = ageFitNormalized(ctx.ageMonths, minAgeMonths, maxAgeMonths);
  const stageRaw = stageDomainBoost(developmentStage, category + " " + text);
  const interestRaw = tokenMatchScore(text, interests);
  const goalRaw = tokenMatchScore(text, goals);
  const challengeRaw = tokenMatchScore(text, challenges);

  let weatherRaw = 0.5;
  if (weatherOpts?.indoorOutdoor) {
    if (signals.isRainy && (weatherOpts.indoorOutdoor === "indoor" || weatherOpts.rainyDay)) weatherRaw = 1;
    else if (signals.isRainy && weatherOpts.indoorOutdoor === "outdoor") weatherRaw = 0.2;
    else if (signals.isSunny && (weatherOpts.indoorOutdoor === "outdoor" || weatherOpts.sunnyDay)) weatherRaw = 1;
    else if (!signals.isRainy && weatherOpts.indoorOutdoor === "indoor") weatherRaw = 0.7;
  } else if (signals.isRainy) {
    weatherRaw = /indoor|sleep|calm|quiet/i.test(text) ? 0.9 : 0.4;
  }

  let weekdayRaw = 0.5;
  if (signals.isWeekend) {
    weekdayRaw = /outdoor|nature|adventure|active/i.test(text) ? 0.9 : 0.6;
  } else {
    weekdayRaw = /quick|routine|calm|indoor|simple/i.test(text) ? 0.85 : 0.55;
  }

  let historyRaw = 1;
  for (const prev of historyTitles) {
    if (prev.length >= 4 && text.includes(prev.toLowerCase())) {
      historyRaw = 0;
      break;
    }
  }

  const moodRaw = moodFitRaw(signals.mood, text, kind);
  const nearbyRaw = nearbyEventRaw(signals.nearby, text);

  return [
    factor("age", "Age fit", SCORING_WEIGHTS.ageFit, ageRaw),
    factor("stage", "Development stage", SCORING_WEIGHTS.developmentStage, stageRaw),
    factor("interests", "Interests", SCORING_WEIGHTS.interests, interestRaw),
    factor("goals", "Parent goals", SCORING_WEIGHTS.goals, goalRaw),
    factor("challenges", "Current challenges", SCORING_WEIGHTS.challenges, challengeRaw),
    factor("weather", "Weather", SCORING_WEIGHTS.weather, weatherRaw),
    factor("weekday", "Weekday / weekend", SCORING_WEIGHTS.weekday, weekdayRaw),
    factor("history", "Activity history", SCORING_WEIGHTS.history, historyRaw),
    factor("mood", "Parent mood", SCORING_WEIGHTS.parentMood, moodRaw),
    factor("nearby", "Nearby events", SCORING_WEIGHTS.nearbyEvents, nearbyRaw),
  ];
}

function totalFromFactors(factors: ScoreFactor[]): number {
  return Math.round(factors.reduce((s, f) => s + f.weighted, 0) * 100);
}

export function scoreRecipe(
  signals: PlanSignals,
  recipe: import("../types").ScorableRecipe
): ScoredCandidate<import("../types").ScorableRecipe> {
  const text = haystack(recipe.subtitle, recipe.ingredients, recipe.tags, recipe.whyThisMeal);
  const disliked = normalizeTokens(signals.foodDislikes);
  for (const d of disliked) {
    if (d.length >= 3 && text.includes(d)) {
      return {
        item: recipe,
        kind: "recipe",
        total: 0,
        factors: [],
        disqualified: true,
        disqualifyReason: `Contains disliked food: ${d}`,
      };
    }
  }

  const factors = buildFactors(
    signals,
    text,
    "eating nutrition",
    recipe.minAgeMonths,
    recipe.maxAgeMonths,
    [
      ...signals.memory.completedActivities,
      ...signals.memory.savedMeals,
      ...signals.previousRecipeSlugs,
    ],
    "recipe"
  );

  const favBoost = tokenMatchScore(text, signals.favouriteFoods);
  if (favBoost > 0) {
    factors.push(factor("favourites", "Favourite foods", 0.05, favBoost));
  }

  return { item: recipe, kind: "recipe", total: totalFromFactors(factors), factors };
}

export function scoreActivity(
  signals: PlanSignals,
  activity: import("../types").ScorableActivity
): ScoredCandidate<import("../types").ScorableActivity> {
  const text = haystack(
    activity.title,
    activity.tags,
    activity.skillsDeveloped,
    activity.materials,
    activity.reason
  );
  const factors = buildFactors(
    signals,
    text,
    activity.skillsDeveloped.join(" "),
    activity.minAgeMonths,
    activity.maxAgeMonths,
    [...signals.memory.completedActivities, ...signals.previousActivitySlugs],
    "activity",
    {
      indoorOutdoor: activity.indoorOutdoor,
      rainyDay: activity.rainyDay,
      sunnyDay: activity.sunnyDay,
    }
  );

  if (signals.profile.personality && /calm|quiet|sensitive/i.test(signals.profile.personality)) {
    const calmBoost = /yoga|fort|shadow|sensory|water pouring/i.test(activity.title) ? 0.15 : 0;
    if (calmBoost) factors.push(factor("personality", "Calm personality", 0.03, calmBoost / 0.15));
  }
  if (signals.profile.personality && /active|energetic|busy/i.test(signals.profile.personality)) {
    const activeBoost = /obstacle|balloon|nature|parade|run/i.test(activity.title) ? 0.15 : 0;
    if (activeBoost) factors.push(factor("personality", "Active personality", 0.03, activeBoost / 0.15));
  }

  return { item: activity, kind: "activity", total: totalFromFactors(factors), factors };
}

export function scoreStory(
  signals: PlanSignals,
  story: import("../types").ScorableStory
): ScoredCandidate<import("../types").ScorableStory> {
  const text = haystack(story.theme, story.titleTemplate, story.tags);
  const factors = buildFactors(
    signals,
    text,
    story.theme,
    story.minAgeMonths,
    story.maxAgeMonths,
    [...signals.memory.completedStories, ...signals.previousStorySlugs],
    "story"
  );

  if (signals.profile.sleepRoutine && /bedtime|calm|sleep/i.test(signals.profile.sleepRoutine)) {
    if (/bedtime|calm|routine|sleep|gentle/i.test(story.theme + story.tags.join(" "))) {
      factors.push(factor("sleep", "Bedtime routine", 0.04, 1));
    }
  }

  return { item: story, kind: "story", total: totalFromFactors(factors), factors };
}

export function scoreTip(
  signals: PlanSignals,
  tip: import("../types").ScorableTip
): ScoredCandidate<import("../types").ScorableTip> {
  const text = haystack(tip.title, tip.content, tip.tryToday, tip.category, tip.tags);
  const factors = buildFactors(
    signals,
    text,
    tip.category,
    tip.minAgeMonths,
    tip.maxAgeMonths,
    [],
    "tip"
  );

  if (signals.profile.priorityGoal && /speech|language/i.test(signals.profile.priorityGoal)) {
    if (/speech|language/i.test(tip.category)) {
      factors.push(factor("priority", "Priority goal match", 0.05, 1));
    }
  }

  return { item: tip, kind: "tip", total: totalFromFactors(factors), factors };
}

export function scoreMilestone(
  signals: PlanSignals,
  milestone: import("../types").ScorableMilestone
): ScoredCandidate<import("../types").ScorableMilestone> {
  const text = haystack(milestone.title, milestone.category, milestone.tags);
  const factors = buildFactors(
    signals,
    text,
    milestone.category,
    milestone.minAgeMonths,
    milestone.maxAgeMonths,
    [],
    "milestone"
  );
  return { item: milestone, kind: "milestone", total: totalFromFactors(factors), factors };
}

export function scoreWeeklyTheme(
  signals: PlanSignals,
  theme: import("../types").ScorableWeeklyTheme
): ScoredCandidate<import("../types").ScorableWeeklyTheme> {
  const text = haystack(theme.title, theme.reason, theme.domain, theme.tags);
  const factors = buildFactors(
    signals,
    text,
    theme.domain,
    theme.minAgeMonths,
    theme.maxAgeMonths,
    [],
    "weekly"
  );
  return { item: theme, kind: "weekly", total: totalFromFactors(factors), factors };
}

export function rankScored<T extends { slug: string }>(
  scored: ScoredCandidate<T>[]
): ScoredCandidate<T>[] {
  return [...scored]
    .filter((s) => !s.disqualified)
    .sort((a, b) => b.total - a.total || a.item.slug.localeCompare(b.item.slug));
}

export function topScored<T extends { slug: string }>(
  scored: ScoredCandidate<T>[]
): ScoredCandidate<T> | undefined {
  return rankScored(scored)[0];
}
