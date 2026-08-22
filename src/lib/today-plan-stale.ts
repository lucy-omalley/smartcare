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
  "favouriteAnimal",
  "favouriteVehicle",
  "favouriteCharacter",
  "storyLearningTheme",
  "storyMoralPreference",
] as const;

export function bodyAffectsTodayPlan(body: Record<string, unknown>): boolean {
  return PLAN_AFFECTING_PROFILE_KEYS.some((key) => key in body && body[key] !== undefined);
}

export const TODAY_PLAN_STALE_KEY = "today_plan_stale";
export const GROWTH_JOURNEY_STALE_KEY = "growth_journey_stale";

function setStaleFlag(key: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, "1");
  localStorage.setItem(key, "1");
}

function consumeStaleFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  const stale =
    sessionStorage.getItem(key) === "1" || localStorage.getItem(key) === "1";
  if (!stale) return false;
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
  return true;
}

/** Mark Today's Plan and Growth Journey as needing a refresh after profile changes. */
export function markPersonalizationStale(): void {
  markTodayPlanStale();
  markGrowthJourneyStale();
}

export function markTodayPlanStale(): void {
  setStaleFlag(TODAY_PLAN_STALE_KEY);
}

export function markGrowthJourneyStale(): void {
  setStaleFlag(GROWTH_JOURNEY_STALE_KEY);
}

export function consumeTodayPlanStale(): boolean {
  return consumeStaleFlag(TODAY_PLAN_STALE_KEY);
}

export function consumeGrowthJourneyStale(): boolean {
  return consumeStaleFlag(GROWTH_JOURNEY_STALE_KEY);
}
