import "server-only";

import type { BriefProfile } from "@/lib/daily-brief-context";
import { fetchWeeklyFocusCandidates } from "@/lib/knowledge/repository";
import type { PlanContext } from "@/lib/knowledge/repository";
import type { AIMemorySignals } from "@/lib/services/today-recommendation-engine";
import { buildPlanSignals } from "./context/build-plan-signals";
import { buildRecommendationReason } from "./explain/build-reason";
import { rankScored, scoreWeeklyTheme } from "./scoring/score-candidate";
import type { PlanSignals, RankedWeeklyFocusPick, ScorableWeeklyTheme, ScoredCandidate } from "./types";

export function weeklyCandidateToScorable(
  candidate: Awaited<ReturnType<typeof fetchWeeklyFocusCandidates>>[number]
): ScorableWeeklyTheme {
  return {
    slug: candidate.slug,
    title: candidate.title,
    reason: candidate.reason,
    domain: candidate.domain,
    tags: candidate.tags,
    minAgeMonths: 0,
    maxAgeMonths: 216,
  };
}

export function rankWeeklyThemes(
  signals: PlanSignals,
  candidates: Awaited<ReturnType<typeof fetchWeeklyFocusCandidates>>
): ScoredCandidate<ScorableWeeklyTheme>[] {
  return rankScored(candidates.map((c) => scoreWeeklyTheme(signals, weeklyCandidateToScorable(c))));
}

export async function recommendWeeklyFocusPick(params: {
  profile: BriefProfile;
  ctx: PlanContext;
  memory: AIMemorySignals;
  excludeTitle?: string | null;
}): Promise<
  RankedWeeklyFocusPick & {
    signals: PlanSignals;
    ranked: ScoredCandidate<ScorableWeeklyTheme>[];
  }
> {
  const signals = buildPlanSignals(params.profile, params.ctx, params.memory);
  const candidates = await fetchWeeklyFocusCandidates(params.profile, params.ctx);

  if (!candidates.length) {
    return {
      themeSlug: "building-connection",
      title: "Building Connection",
      reason: "Small moments of presence and play strengthen your bond this week.",
      signals,
      ranked: [],
    };
  }

  let ranked = rankWeeklyThemes(signals, candidates);
  if (params.excludeTitle) {
    const filtered = ranked.filter(
      (r) => r.item.title.toLowerCase() !== params.excludeTitle!.toLowerCase()
    );
    if (filtered.length) ranked = filtered;
  }

  const top = ranked[0];
  const fallbackReason =
    candidates.find((c) => c.slug === top?.item.slug)?.reason ??
    "Chosen to support your family's goals this week.";

  return {
    themeSlug: top?.item.slug ?? candidates[0]!.slug,
    title: top?.item.title ?? candidates[0]!.title,
    reason: buildRecommendationReason(top, fallbackReason),
    scored: top,
    signals,
    ranked,
  };
}
