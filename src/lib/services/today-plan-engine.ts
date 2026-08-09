import "server-only";

import type { BriefProfile } from "@/lib/daily-brief-context";
import { resolveChildAgeDisplay } from "@/lib/child-age";
import { completeAI } from "@/lib/ai/provider";
import { logAIRequest } from "@/lib/ai/usage";
import { PERSONALIZE_PLAN_SYSTEM } from "@/lib/ai/prompts";
import { getCachedAIResponse, setCachedAIResponse } from "@/lib/ai/cache";
import {
  buildPlanContext,
  buildSemanticCacheKey,
  fetchKnowledgeCandidates,
  loadActivityBySlug,
  loadMilestone,
  loadRecipeBySlug,
  loadStoryBySlug,
  loadTipAsDevelopment,
} from "@/lib/knowledge/repository";
import { defaultDailyBrief } from "@/lib/services/mumbot";
import type { DailyBriefContent, WeatherInfo, WeeklyFocus } from "@/types/daily-brief";

interface PersonalizationPick {
  recipeSlug?: string;
  activitySlug?: string;
  storySlug?: string;
  tipSlug?: string;
  milestoneSlug?: string;
  greeting?: string;
  todayFocusTitle?: string;
  todayFocusReason?: string;
  encouragement?: string;
}

function deterministicPick(candidates: Awaited<ReturnType<typeof fetchKnowledgeCandidates>>): PersonalizationPick {
  return {
    recipeSlug: candidates.recipes[0]?.slug,
    activitySlug: candidates.activities[0]?.slug,
    storySlug: candidates.stories[0]?.slug,
    tipSlug: candidates.tips[0]?.slug,
    milestoneSlug: candidates.milestones[0]?.slug,
  };
}

/**
 * DB-first Today's Plan: retrieve candidates → cache → compact AI selection (or deterministic fallback).
 * AI never invents recipes/activities/stories — only picks and writes short copy.
 */
export async function buildPersonalizedDailyBrief(params: {
  userId: string;
  profile: BriefProfile;
  weather: WeatherInfo | null;
  weeklyFocus: WeeklyFocus;
}): Promise<DailyBriefContent> {
  const { userId, profile, weather, weeklyFocus } = params;
  const ctx = buildPlanContext(profile, weather);
  const cacheKey = `today-plan:${buildSemanticCacheKey(profile, ctx)}`;

  const cached = await getCachedAIResponse<PersonalizationPick>(cacheKey);
  let pick: PersonalizationPick | null = cached;

  const candidates = await fetchKnowledgeCandidates(profile, ctx);
  if (!candidates.recipes.length && !candidates.activities.length) {
    await logAIRequest({ userId, feature: "TODAY_PLAN", resolution: "DB_ONLY" });
    return defaultDailyBrief(profile, weeklyFocus);
  }

  if (pick) {
    await logAIRequest({ userId, feature: "PERSONALIZE", resolution: "CACHE_HIT" });
  }

  if (!pick) {
    const compactInput = {
      age: ctx.ageMonths ?? profile.childAge,
      likes: profile.childInterests ?? [],
      goals: profile.parentingGoals ?? [],
      priority: profile.priorityGoal,
      weather: ctx.weather?.description ?? "unknown",
      weekend: ctx.isWeekend,
      candidates,
    };

    try {
      const result = await completeAI({
        feature: "PERSONALIZE",
        systemPrompt: PERSONALIZE_PLAN_SYSTEM,
        userPrompt: JSON.stringify(compactInput),
        maxTokens: 350,
        temperature: 0.6,
        jsonMode: true,
        userId,
        cacheKey,
        cacheTtlSeconds: 86400,
      });
      pick = JSON.parse(result.content) as PersonalizationPick;
      if (!result.cacheHit) {
        await setCachedAIResponse(cacheKey, "PERSONALIZE", pick, 86400);
      }
    } catch {
      await logAIRequest({ userId, feature: "PERSONALIZE", resolution: "DB_ONLY" });
      pick = deterministicPick(candidates);
    }
  }

  pick = { ...deterministicPick(candidates), ...pick };

  const child = profile.childNickname ?? "your little one";
  const parent = profile.name?.split(" ")[0] ?? "there";

  const [recipe, play, story, languageDev, milestoneRow] = await Promise.all([
    pick.recipeSlug ? loadRecipeBySlug(pick.recipeSlug) : null,
    pick.activitySlug ? loadActivityBySlug(pick.activitySlug) : null,
    pick.storySlug ? loadStoryBySlug(pick.storySlug, child) : null,
    pick.tipSlug ? loadTipAsDevelopment(pick.tipSlug) : null,
    pick.milestoneSlug ? loadMilestone(pick.milestoneSlug) : null,
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
    greeting: pick.greeting ?? base.greeting ?? `Good morning, ${parent}!`,
    childAgeDisplay: resolveChildAgeDisplay(profile) ?? base.childAgeDisplay,
    weeklyFocus,
    todayFocus: {
      title: pick.todayFocusTitle ?? weeklyFocus.title,
      reason: pick.todayFocusReason ?? weeklyFocus.reason,
    },
    recipe: recipe ?? base.recipe,
    play: play ?? base.play,
    bedtimeStory: story ?? base.bedtimeStory,
    development,
    encouragement: pick.encouragement ?? base.encouragement,
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
