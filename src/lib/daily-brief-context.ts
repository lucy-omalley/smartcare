import { MemoryCategory } from "@prisma/client";

export interface BriefProfile {
  name?: string | null;
  childNickname?: string | null;
  childAge?: string | null;
  childBirthday?: string | null;
  childGender?: string | null;
  childInterests?: string[];
  favouriteToys?: string[];
  favouriteThemes?: string[];
  favouriteBooks?: string[];
  favouriteFoods?: string[];
  foodDislikes?: string[];
  sleepRoutine?: string | null;
  schoolNursery?: string | null;
  personality?: string | null;
  homeLanguage?: string | null;
  foodPreferences?: string[];
  routineNotes?: string | null;
  developmentNotes?: string | null;
  parentingGoal?: string | null;
  parentingGoals?: string[];
  priorityGoal?: string | null;
  currentChallenges?: string[];
  location?: string | null;
  broadArea?: string | null;
  weeklyFocusTitle?: string | null;
  favouriteAnimal?: string | null;
  favouriteVehicle?: string | null;
  favouriteCharacter?: string | null;
  storyLearningTheme?: string | null;
  storyMoralPreference?: string | null;
}

export interface BriefMemory {
  content: string;
  category: MemoryCategory;
}

/** @deprecated Use buildWeightedRecommendationContext from today-recommendation-engine */
export function buildDailyBriefContext(
  profile: BriefProfile,
  memories: BriefMemory[],
  recentMessages: string[],
  weeklyFocus?: string | null
): string {
  const parts: string[] = [];

  parts.push(`Parent name: ${profile.name ?? "Parent"}`);
  if (profile.childNickname) parts.push(`Child nickname: ${profile.childNickname}`);
  if (profile.childAge) parts.push(`Child age: ${profile.childAge}`);
  if (profile.childInterests?.length) parts.push(`Child interests: ${profile.childInterests.join(", ")}`);
  if (profile.foodPreferences?.length) parts.push(`Food preferences: ${profile.foodPreferences.join(", ")}`);
  if (profile.routineNotes) parts.push(`Routine notes: ${profile.routineNotes}`);
  if (profile.developmentNotes) parts.push(`Development notes: ${profile.developmentNotes}`);
  if (profile.parentingGoals?.length) {
    parts.push(`Parenting goals: ${profile.parentingGoals.join(", ")}`);
  } else if (profile.parentingGoal) {
    parts.push(`Current parenting goal: ${profile.parentingGoal}`);
  }
  if (profile.priorityGoal) parts.push(`Priority goal: ${profile.priorityGoal}`);
  if (profile.currentChallenges?.length) {
    parts.push(`Current challenges: ${profile.currentChallenges.join(", ")}`);
  }
  if (profile.location) parts.push(`Location: ${profile.location}`);
  if (profile.broadArea) parts.push(`Broad area: ${profile.broadArea}`);
  if (weeklyFocus) parts.push(`Weekly focus: ${weeklyFocus}`);

  if (memories.length > 0) {
    parts.push("\nFamily memories:");
    memories.forEach((m) => parts.push(`- [${m.category}] ${m.content}`));
  }

  if (recentMessages.length > 0) {
    parts.push("\nRecent conversation snippets:");
    recentMessages.slice(-8).forEach((m) => parts.push(`- ${m.slice(0, 200)}`));
  }

  return parts.join("\n");
}
