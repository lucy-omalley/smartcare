import "server-only";

import type { BriefProfile } from "@/lib/daily-brief-context";
import { completeAI } from "@/lib/ai/provider";
import { logAIRequest } from "@/lib/ai/usage";
import { getCachedAIResponse, setCachedAIResponse } from "@/lib/ai/cache";
import { buildPlanContext, buildSemanticCacheKey } from "@/lib/knowledge/repository";
import { fetchWeeklyFocusCandidates, loadWeeklyThemeBySlug } from "@/lib/knowledge/repository";
import type { WeeklyFocus } from "@/types/daily-brief";

export const WEEKLY_FOCUS_PICK_SYSTEM = `You are Parenfy's weekly focus selector. Pick ONE theme from candidates — never invent new themes.

Return JSON only: { "themeSlug": "string", "reason": "max 50 words — personalize why this theme fits this family now" }

Rules: themeSlug must be from candidates. Warm, specific tone.`;

function deterministicWeeklyPick(
  candidates: Awaited<ReturnType<typeof fetchWeeklyFocusCandidates>>
): { themeSlug: string; reason?: string } {
  return { themeSlug: candidates[0]?.slug ?? "building-connection" };
}

export async function buildPersonalizedWeeklyFocus(params: {
  userId: string;
  profile: BriefProfile;
  contextSummary: string;
  excludeTitle?: string | null;
}): Promise<WeeklyFocus> {
  const { userId, profile, contextSummary, excludeTitle } = params;
  const ctx = buildPlanContext(profile, null);
  const cacheKey = `weekly-focus:${buildSemanticCacheKey(profile, ctx)}:${excludeTitle ?? "default"}`;

  const cached = await getCachedAIResponse<{ themeSlug: string; reason?: string }>(cacheKey);
  const candidates = await fetchWeeklyFocusCandidates(profile, ctx);

  if (!candidates.length) {
    await logAIRequest({ userId, feature: "WEEKLY_PLAN", resolution: "DB_ONLY" });
    return {
      title: "Building Connection",
      reason: "Small moments of presence and play strengthen your bond this week.",
    };
  }

  let pick = cached ?? null;
  if (pick) {
    await logAIRequest({ userId, feature: "WEEKLY_PLAN", resolution: "CACHE_HIT" });
  }
  if (!pick) {
    const filtered = excludeTitle
      ? candidates.filter((c) => c.title.toLowerCase() !== excludeTitle.toLowerCase())
      : candidates;
    const pool = filtered.length ? filtered : candidates;

    try {
      const result = await completeAI({
        feature: "WEEKLY_PLAN",
        systemPrompt: WEEKLY_FOCUS_PICK_SYSTEM,
        userPrompt: JSON.stringify({
          context: contextSummary.slice(0, 1500),
          candidates: pool,
        }),
        maxTokens: 200,
        temperature: 0.6,
        jsonMode: true,
        userId,
        cacheKey,
        cacheTtlSeconds: 604800,
      });
      pick = JSON.parse(result.content) as { themeSlug: string; reason?: string };
      if (!result.cacheHit) {
        await setCachedAIResponse(cacheKey, "WEEKLY_PLAN", pick, 604800);
      }
    } catch {
      pick = deterministicWeeklyPick(pool);
    }
  }

  pick = { ...deterministicWeeklyPick(candidates), ...pick };
  const theme = await loadWeeklyThemeBySlug(pick.themeSlug);
  if (!theme) {
    return {
      title: candidates[0].title,
      reason: pick.reason ?? candidates[0].reason,
    };
  }

  return {
    title: theme.title,
    reason: pick.reason ?? theme.reason,
  };
}
