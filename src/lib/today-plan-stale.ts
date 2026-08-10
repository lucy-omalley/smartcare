/** Profile fields that should trigger a fresh Today's Plan when changed. */
export const PLAN_AFFECTING_PROFILE_KEYS = [
  "childNickname",
  "childAge",
  "childBirthday",
  "childGender",
  "childInterests",
  "favouriteToys",
  "favouriteThemes",
  "favouriteBooks",
  "favouriteFoods",
  "foodDislikes",
  "sleepRoutine",
  "schoolNursery",
  "personality",
  "homeLanguage",
  "foodPreferences",
  "routineNotes",
  "developmentNotes",
  "parentingGoal",
  "parentingGoals",
  "priorityGoal",
  "currentChallenges",
  "location",
] as const;

export function bodyAffectsTodayPlan(body: Record<string, unknown>): boolean {
  return PLAN_AFFECTING_PROFILE_KEYS.some((key) => key in body && body[key] !== undefined);
}

export const TODAY_PLAN_STALE_KEY = "today_plan_stale";

export function markTodayPlanStale(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TODAY_PLAN_STALE_KEY, "1");
  localStorage.setItem(TODAY_PLAN_STALE_KEY, "1");
}

export function consumeTodayPlanStale(): boolean {
  if (typeof window === "undefined") return false;
  const stale =
    sessionStorage.getItem(TODAY_PLAN_STALE_KEY) === "1" ||
    localStorage.getItem(TODAY_PLAN_STALE_KEY) === "1";
  if (!stale) return false;
  sessionStorage.removeItem(TODAY_PLAN_STALE_KEY);
  localStorage.removeItem(TODAY_PLAN_STALE_KEY);
  return true;
}
