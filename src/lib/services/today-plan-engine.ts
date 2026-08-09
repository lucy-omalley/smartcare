import "server-only";

import type { BriefProfile } from "@/lib/daily-brief-context";
import { resolveChildAgeDisplay } from "@/lib/child-age";
import { completeAI } from "@/lib/ai/provider";
import { logAIRequest } from "@/lib/ai/usage";
import { PERSONALIZE_COPY_SYSTEM } from "@/lib/ai/prompts";
import { getCachedAIResponse, setCachedAIResponse } from "@/lib/ai/cache";
import {
  buildPlanContext,
  buildSemanticCacheKey,
  loadActivityBySlug,
  loadMilestone,
  loadRecipeBySlug,
  loadStoryBySlug,
  loadTipAsDevelopment,
} from "@/lib/knowledge/repository";
import { recommendTodayPlanPicks } from "@/lib/intelligence/recommend-today-plan";
import { defaultDailyBrief } from "@/lib/services/mumbot";
import type { AIMemorySignals } from "@/lib/services/today-recommendation-engine";
import type { DailyBriefContent, WeatherInfo, WeeklyFocus } from "@/types/daily-brief";

interface PersonalizationCopy {
  greeting?: string;
  todayFocusTitle?: string;
  todayFocusReason?: string;
  encouragement?: string;
}

/**
 * Parent Intelligence Engine → Today's Plan.
 * Score-first slug selection from knowledge DB; AI writes short copy only.
 */
export async function buildPersonalizedDailyBrief(params: {
  userId: string;
  profile: BriefProfile;
  weather: WeatherInfo | null;
  weeklyFocus: WeeklyFocus;
  memorySignals: AIMemorySignals;
}): Promise<DailyBriefContent> {
  const { userId, profile, weather, weeklyFocus, memorySignals } = params;
  const ctx = buildPlanContext(profile, weather);
  const cacheKey = `today-plan-copy:${buildSemanticCacheKey(profile, ctx)}`;

  const { recipeSlug, activitySlug, storySlug, tipSlug, milestoneSlug, reasons } =
    await recommendTodayPlanPicks({ profile, ctx, memory: memorySignals });

  if (!recipeSlug && !activitySlug) {
    await logAIRequest({ userId, feature: "TODAY_PLAN", resolution: "DB_ONLY" });
    return defaultDailyBrief(profile, weeklyFocus);
  }

  let copy: PersonalizationCopy | null = await getCachedAIResponse<PersonalizationCopy>(cacheKey);

  if (!copy) {
    try {
      const result = await completeAI({
        feature: "PERSONALIZE",
        systemPrompt: PERSONALIZE_COPY_SYSTEM,
        userPrompt: JSON.stringify({
          child: profile.childNickname,
          age: ctx.ageMonths ?? profile.childAge,
          stage: profile.childAge,
          weeklyFocus,
          weather: ctx.weather?.description ?? "unknown",
          weekend: ctx.isWeekend,
          goals: profile.parentingGoals,
          priority: profile.priorityGoal,
          selected: { recipeSlug, activitySlug, storySlug, tipSlug, milestoneSlug },
        }),
        maxTokens: 200,
        temperature: 0.65,
        jsonMode: true,
        userId,
        cacheKey,
        cacheTtlSeconds: 86400,
      });
      copy = JSON.parse(result.content) as PersonalizationCopy;
      if (!result.cacheHit) {
        await setCachedAIResponse(cacheKey, "PERSONALIZE", copy, 86400);
      }
    } catch {
      await logAIRequest({ userId, feature: "PERSONALIZE", resolution: "DB_ONLY" });
      copy = {};
    }
  } else {
    await logAIRequest({ userId, feature: "PERSONALIZE", resolution: "CACHE_HIT" });
  }

  const child = profile.childNickname ?? "your little one";
  const parent = profile.name?.split(" ")[0] ?? "there";

  const [recipe, play, story, languageDev, milestoneRow] = await Promise.all([
    recipeSlug ? loadRecipeBySlug(recipeSlug) : null,
    activitySlug ? loadActivityBySlug(activitySlug) : null,
    storySlug ? loadStoryBySlug(storySlug, child) : null,
    tipSlug ? loadTipAsDevelopment(tipSlug) : null,
    milestoneSlug ? loadMilestone(milestoneSlug) : null,
  ]);

  const base = defaultDailyBrief(profile, weeklyFocus);

  const development = [...base.development];
  if (languageDev) {
    const idx = development.findIndex((d) => /language|speech/i.test(d.domain));
    if (idx >= 0) development[idx] = languageDev;
    else development.unshift(languageDev);
  }

  return {
    ...base,
    greeting: copy?.greeting ?? base.greeting ?? `Good morning, ${parent}!`,
    childAgeDisplay: resolveChildAgeDisplay(profile) ?? base.childAgeDisplay,
    weeklyFocus,
    todayFocus: {
      title: copy?.todayFocusTitle ?? weeklyFocus.title,
      reason: copy?.todayFocusReason ?? weeklyFocus.reason,
    },
    recipe: recipe
      ? { ...recipe, whyThisMeal: reasons.recipe ?? recipe.whyThisMeal }
      : base.recipe,
    play: play ? { ...play, reason: reasons.activity ?? play.reason } : base.play,
    bedtimeStory: story
      ? { ...story, reason: reasons.story ?? story.reason }
      : base.bedtimeStory,
    development,
    encouragement: copy?.encouragement ?? base.encouragement,
    milestone: milestoneRow
      ? {
          domain: milestoneRow.category,
          milestone: milestoneRow.title,
          whyItMatters: milestoneRow.whyItMatters ?? milestoneRow.description,
          tip: milestoneRow.parentTip ?? "Celebrate small steps — progress is rarely linear.",
        }
      : base.milestone,
    tip: languageDev
      ? { topic: "Today's tip", content: languageDev.insight }
      : base.tip,
    weatherNote: weather
      ? `Today looks ${weather.description.toLowerCase()} — ${ctx.isRainy ? "indoor play may suit best" : "a lovely day to get outside if you can"}.`
      : base.weatherNote,
  };
}
