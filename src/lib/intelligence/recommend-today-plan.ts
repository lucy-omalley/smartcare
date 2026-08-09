import "server-only";

import type { KnowledgeScoringPool, PlanHistory, PlanSignals, RankedPlanPicks } from "./types";
import { buildPlanSignalsForUser } from "./context/build-plan-signals-for-user";
import { buildRecommendationReason } from "./explain/build-reason";
import {
  rankScored,
  scoreActivity,
  scoreMilestone,
  scoreRecipe,
  scoreStory,
  scoreTip,
} from "./scoring/score-candidate";
import { fetchKnowledgeScoringPool } from "@/lib/knowledge/repository";
import type { BriefProfile } from "@/lib/daily-brief-context";
import type { PlanContext } from "@/lib/knowledge/repository";
import type { AIMemorySignals } from "@/lib/services/today-recommendation-engine";

export { buildPlanSignals } from "./context/build-plan-signals";
export { buildPlanSignalsForUser } from "./context/build-plan-signals-for-user";

/**
 * Parent Intelligence Engine — score-first recommendation.
 * Deterministic slug selection; reasons from score breakdown.
 */
export function rankTodayPlanCandidates(
  signals: PlanSignals,
  pool: KnowledgeScoringPool
): RankedPlanPicks {
  const recipeScored = rankScored(pool.recipes.map((r) => scoreRecipe(signals, r)));
  const activityScored = rankScored(pool.activities.map((a) => scoreActivity(signals, a)));
  const storyScored = rankScored(pool.stories.map((s) => scoreStory(signals, s)));
  const tipScored = rankScored(pool.tips.map((t) => scoreTip(signals, t)));
  const milestoneScored = rankScored(pool.milestones.map((m) => scoreMilestone(signals, m)));

  const topRecipe = recipeScored[0];
  const topActivity = activityScored[0];
  const topStory = storyScored[0];
  const topTip = tipScored[0];
  const topMilestone = milestoneScored[0];

  return {
    recipeSlug: topRecipe?.item.slug,
    activitySlug: topActivity?.item.slug,
    storySlug: topStory?.item.slug,
    tipSlug: topTip?.item.slug,
    milestoneSlug: topMilestone?.item.slug,
    reasons: {
      recipe: buildRecommendationReason(topRecipe, "Recommended because this balanced meal suits your child's stage."),
      activity: buildRecommendationReason(topActivity, "Recommended because playful activities support development."),
      story: buildRecommendationReason(topStory, "Recommended because a gentle story helps wind down at bedtime."),
      tip: buildRecommendationReason(topTip, "Recommended because this tip supports development at this stage."),
      milestone: buildRecommendationReason(topMilestone, "Recommended because this milestone is typical for this age."),
    },
  };
}

export async function recommendTodayPlanPicks(params: {
  userId: string;
  profile: BriefProfile;
  ctx: PlanContext;
  memory: AIMemorySignals;
  history?: PlanHistory;
}): Promise<RankedPlanPicks & { signals: PlanSignals; pool: KnowledgeScoringPool }> {
  const signals = await buildPlanSignalsForUser({
    userId: params.userId,
    profile: params.profile,
    ctx: params.ctx,
    memory: params.memory,
    history: params.history,
  });
  const pool = await fetchKnowledgeScoringPool(params.profile, params.ctx);
  const ranked = rankTodayPlanCandidates(signals, pool);
  return { ...ranked, signals, pool };
}
