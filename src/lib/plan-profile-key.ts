import type { DailyBriefContent } from "@/types/daily-brief";
import { PLAN_AFFECTING_PROFILE_KEYS } from "@/lib/today-plan-stale";

/** Stable fingerprint of profile fields that affect Today's Plan content. */
export function buildPlanProfileKey(profile: Record<string, unknown>): string {
  return PLAN_AFFECTING_PROFILE_KEYS.map((key) => {
    const value = profile[key];
    if (Array.isArray(value)) return value.join("|");
    if (value == null) return "";
    return String(value).trim();
  }).join("::");
}

export function briefMatchesProfile(
  brief: DailyBriefContent,
  profile: Record<string, unknown>
): boolean {
  if (!brief._planProfileKey) return true;
  return brief._planProfileKey === buildPlanProfileKey(profile);
}

export function withPlanProfileKey(
  brief: DailyBriefContent,
  profile: Record<string, unknown>
): DailyBriefContent {
  return { ...brief, _planProfileKey: buildPlanProfileKey(profile) };
}
