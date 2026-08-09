import "server-only";

import type { BriefProfile } from "@/lib/daily-brief-context";
import { completeAI } from "@/lib/ai/provider";
import { logAIRequest, logCachedFeatureUsage } from "@/lib/ai/usage";
import { getCachedAIResponse, setCachedAIResponse } from "@/lib/ai/cache";
import { WEEKLY_FOCUS_COPY_SYSTEM } from "@/lib/ai/prompts";
import { buildPlanContext, buildSemanticCacheKey, loadWeeklyThemeBySlug } from "@/lib/knowledge/repository";
import { recommendWeeklyFocusPick } from "@/lib/intelligence/recommend-weekly-focus";
import type { AIMemorySignals } from "@/lib/services/today-recommendation-engine";
import type { WeeklyFocus } from "@/types/daily-brief";

export async function buildPersonalizedWeeklyFocus(params: {
  userId: string;
  profile: BriefProfile;
  contextSummary: string;
  memorySignals: AIMemorySignals;
  excludeTitle?: string | null;
}): Promise<WeeklyFocus> {
  const { userId, profile, contextSummary, memorySignals, excludeTitle } = params;
  const ctx = buildPlanContext(profile, null);
  const pick = await recommendWeeklyFocusPick({
    userId,
    profile,
    ctx,
    memory: memorySignals,
    excludeTitle,
  });

  const cacheKey = `weekly-focus-copy:${buildSemanticCacheKey(profile, ctx)}:${pick.themeSlug}`;

  const cached = await getCachedAIResponse<{ reason?: string }>(cacheKey);
  if (cached?.reason) {
    await logCachedFeatureUsage({ userId, feature: "WEEKLY_PLAN" });
    await logAIRequest({ userId, feature: "WEEKLY_PLAN", resolution: "CACHE_HIT" });
    return { title: pick.title, reason: cached.reason };
  }

  let reason = pick.reason;
  try {
    const result = await completeAI({
      feature: "WEEKLY_PLAN",
      systemPrompt: WEEKLY_FOCUS_COPY_SYSTEM,
      userPrompt: JSON.stringify({
        themeTitle: pick.title,
        scoredReason: pick.reason,
        context: contextSummary.slice(0, 1200),
      }),
      maxTokens: 120,
      temperature: 0.5,
      jsonMode: true,
      userId,
      cacheKey,
      cacheTtlSeconds: 604800,
    });
    const parsed = JSON.parse(result.content) as { reason?: string };
    reason = parsed.reason?.trim() || pick.reason;
    if (!result.cacheHit) {
      await setCachedAIResponse(cacheKey, "WEEKLY_PLAN", { reason }, 604800);
      await logAIRequest({ userId, feature: "WEEKLY_PLAN", resolution: "LLM" });
    }
  } catch {
    await logAIRequest({ userId, feature: "WEEKLY_PLAN", resolution: "DB_ONLY" });
    return { title: pick.title, reason: pick.reason };
  }

  const theme = await loadWeeklyThemeBySlug(pick.themeSlug);
  return {
    title: theme?.title ?? pick.title,
    reason,
  };
}
