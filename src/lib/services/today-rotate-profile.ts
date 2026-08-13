import type { BriefProfile } from "@/lib/daily-brief-context";
import { resolveChildAgeDisplay } from "@/lib/child-age";
import { getDevelopmentStage, parseChildAgeMonths } from "@/lib/child-development";
import type {
  DailyBriefDevelopment,
  DailyBriefPlay,
  DailyBriefRecipe,
  DailyBriefStory,
} from "@/types/daily-brief";

export interface EnrichedRotateProfile extends BriefProfile {
  childAgeDisplay: string | null;
  developmentStage: string;
  ageMonths: number | null;
  ageYears: number | null;
}

export function enrichRotateProfile(profile: BriefProfile): EnrichedRotateProfile {
  const childAgeDisplay = resolveChildAgeDisplay(profile);
  const ageMonths = parseChildAgeMonths(childAgeDisplay ?? profile.childAge, profile.childBirthday);
  const ageYears = ageMonths === null ? null : ageMonths / 12;
  const developmentStage = getDevelopmentStage(childAgeDisplay ?? profile.childAge, profile.childBirthday);

  return {
    ...profile,
    childAge: childAgeDisplay ?? profile.childAge,
    childAgeDisplay,
    developmentStage,
    ageMonths,
    ageYears,
  };
}

function normalizeTokens(values: string[] | null | undefined): string[] {
  return (values ?? []).map((v) => v.trim().toLowerCase()).filter(Boolean);
}

function haystack(...parts: Array<string | string[] | null | undefined>): string {
  return parts
    .flatMap((part) => (Array.isArray(part) ? part : part ? [part] : []))
    .join(" ")
    .toLowerCase();
}

function parsePlayAgeRange(ageRecommendation?: string | null): { min: number; max: number } {
  const range = ageRecommendation?.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    return { min: parseInt(range[1]!, 10), max: parseInt(range[2]!, 10) };
  }
  const single = ageRecommendation?.match(/(\d+)/);
  if (single) {
    const age = parseInt(single[1]!, 10);
    return { min: age, max: age + 2 };
  }
  return { min: 2, max: 6 };
}

function ageFitScore(ageYears: number | null, min: number, max: number): number {
  if (ageYears === null) return 0;
  if (ageYears >= min && ageYears <= max) return 12;
  if (ageYears < min) return Math.max(0, 8 - (min - ageYears) * 3);
  return Math.max(0, 6 - (ageYears - max) * 2);
}

function interestScore(text: string, interests: string[]): number {
  if (!interests.length) return 0;
  let score = 0;
  for (const interest of interests) {
    if (interest.length >= 3 && text.includes(interest)) score += 4;
  }
  return score;
}

function foodPreferenceScore(recipe: DailyBriefRecipe, favourites: string[]): number {
  const text = haystack(recipe.subtitle, recipe.ingredients, recipe.whyThisMeal);
  let score = 0;
  for (const fav of favourites) {
    if (fav.length >= 3 && text.includes(fav)) score += 6;
  }
  return score;
}

function foodDislikePenalty(recipe: DailyBriefRecipe, dislikes: string[]): number {
  const text = haystack(recipe.subtitle, recipe.ingredients);
  for (const dislike of dislikes) {
    if (dislike.length >= 3 && text.includes(dislike)) return -100;
  }
  return 0;
}

/** Language tips indexed to match LANGUAGE_ALTERNATES order in today-rotate-content.ts */
const LANGUAGE_AGE_BANDS: Array<{ min: number; max: number }> = [
  { min: 1.5, max: 4 }, // bath naming
  { min: 2, max: 5 }, // two-word phrases
  { min: 1.5, max: 4 }, // animal sounds
  { min: 2, max: 5 }, // choices
  { min: 2.5, max: 6 }, // books
  { min: 2, max: 6 }, // rhymes
  { min: 2.5, max: 6 }, // I see walk
  { min: 2, max: 5 }, // puppet
  { min: 1.5, max: 4 }, // gestures
  { min: 2.5, max: 5 }, // counting
  { min: 2.5, max: 6 }, // emotions
  { min: 3, max: 6 }, // cooking verbs
  { min: 3, max: 6 }, // day recap
  { min: 2.5, max: 6 }, // colours drawing
  { min: 2.5, max: 6 }, // wait time
];

function rankByScore<T>(items: T[], scoreFn: (item: T, index: number) => number): T[] {
  return [...items]
    .map((item, index) => ({ item, index, score: scoreFn(item, index) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item);
}

export function rankRecipesForProfile(
  profile: EnrichedRotateProfile,
  recipes: Omit<DailyBriefRecipe, "imageData" | "sampleLinks" | "fromFridge">[]
): Omit<DailyBriefRecipe, "imageData" | "sampleLinks" | "fromFridge">[] {
  const favourites = normalizeTokens([
    ...(profile.favouriteFoods ?? []),
    ...(profile.foodPreferences ?? []),
  ]);
  const dislikes = normalizeTokens(profile.foodDislikes);

  const eligible = recipes.filter((recipe) => foodDislikePenalty(recipe, dislikes) > -50);
  const pool = eligible.length > 0 ? eligible : recipes;

  return rankByScore(pool, (recipe) => {
    let score = 0;
    score += foodPreferenceScore(recipe, favourites);
    score += interestScore(haystack(recipe.subtitle, recipe.ingredients), normalizeTokens(profile.childInterests));
    if (profile.developmentNotes) {
      score += interestScore(haystack(recipe.whyThisMeal, recipe.subtitle), normalizeTokens([profile.developmentNotes]));
    }
    return score;
  });
}

export function rankPlayForProfile(
  profile: EnrichedRotateProfile,
  activities: Omit<DailyBriefPlay, "imageData">[]
): Omit<DailyBriefPlay, "imageData">[] {
  const interests = normalizeTokens([
    ...(profile.childInterests ?? []),
    ...(profile.favouriteThemes ?? []),
    ...(profile.favouriteToys ?? []),
  ]);

  return rankByScore(activities, (activity) => {
    const range = parsePlayAgeRange(activity.ageRecommendation);
    let score = ageFitScore(profile.ageYears, range.min, range.max);
    score += interestScore(
      haystack(activity.title, activity.skillsDeveloped, activity.materials, activity.reason),
      interests
    );
    if (profile.personality && /calm|quiet|sensitive/i.test(profile.personality)) {
      if (/yoga|fort|shadow|story|sensory/i.test(activity.title)) score += 3;
      if (/obstacle|parade|balloon/i.test(activity.title)) score -= 1;
    }
    if (profile.personality && /active|energetic|busy/i.test(profile.personality)) {
      if (/obstacle|balloon|parade|nature|bug/i.test(activity.title)) score += 3;
    }
    return score;
  });
}

export function rankStoriesForProfile(
  profile: EnrichedRotateProfile,
  stories: Omit<DailyBriefStory, "illustrationData">[]
): Omit<DailyBriefStory, "illustrationData">[] {
  const themes = normalizeTokens([
    ...(profile.favouriteThemes ?? []),
    ...(profile.childInterests ?? []),
    ...(profile.favouriteBooks ?? []),
  ]);

  return rankByScore(stories, (story) => {
    let score = 0;
    score += interestScore(haystack(story.theme, story.title, story.story), themes);
    if (profile.sleepRoutine && /bedtime|calm|sleep|quiet/i.test(profile.sleepRoutine)) {
      if (/routine|wonder|friendship|nature|emotions/i.test(story.theme ?? "")) score += 3;
    }
    if (profile.priorityGoal && /language|speech|read/i.test(profile.priorityGoal)) {
      if (/curiosity|imagination|curiosity/i.test(story.theme ?? "")) score += 2;
    }
    return score;
  });
}

export function rankLanguageForProfile(
  profile: EnrichedRotateProfile,
  tips: DailyBriefDevelopment[]
): DailyBriefDevelopment[] {
  return rankByScore(tips, (tip, index) => {
    const band = LANGUAGE_AGE_BANDS[index] ?? { min: 2, max: 6 };
    let score = ageFitScore(profile.ageYears, band.min, band.max);
    if (profile.homeLanguage && profile.homeLanguage.toLowerCase() !== "english") {
      if (/gesture|sound|name|choice/i.test(tip.tryToday)) score += 2;
    }
    if (profile.developmentNotes) {
      score += interestScore(haystack(tip.insight, tip.tryToday), normalizeTokens([profile.developmentNotes]));
    }
    if (profile.priorityGoal && /speech|language|talk/i.test(profile.priorityGoal)) {
      score += 2;
    }
    return score;
  });
}

export function personalizeRecipe(
  recipe: Omit<DailyBriefRecipe, "imageData" | "sampleLinks" | "fromFridge">,
  profile: EnrichedRotateProfile
): Omit<DailyBriefRecipe, "imageData" | "sampleLinks" | "fromFridge"> {
  const child = profile.childNickname?.trim() || "your child";
  const stage = profile.developmentStage;
  const favourites = normalizeTokens([
    ...(profile.favouriteFoods ?? []),
    ...(profile.foodPreferences ?? []),
  ]);
  const matchedFav = favourites.find((fav) =>
    haystack(recipe.subtitle, recipe.ingredients).includes(fav)
  );

  let whyThisMeal = recipe.whyThisMeal;
  if (!whyThisMeal.includes(child)) {
    whyThisMeal = whyThisMeal.replace(
      /^Recommended because/i,
      `Recommended for ${child} (${stage}) because`
    );
  }
  if (matchedFav) {
    whyThisMeal = `${whyThisMeal} It also fits ${child}'s taste for ${matchedFav}.`;
  }

  return { ...recipe, whyThisMeal };
}

export function personalizePlay(
  activity: Omit<DailyBriefPlay, "imageData">,
  profile: EnrichedRotateProfile
): Omit<DailyBriefPlay, "imageData"> {
  const child = profile.childNickname?.trim() || "your child";
  const stage = profile.developmentStage;
  let reason = activity.reason ?? "Recommended because playful movement supports growing bodies and minds.";
  if (!reason.includes(child)) {
    reason = reason.replace(
      /^Recommended because/i,
      `Recommended for ${child} (${stage}) because`
    );
  }
  return { ...activity, reason, ageRecommendation: profile.childAgeDisplay ?? activity.ageRecommendation };
}

export function personalizeStory(
  story: Omit<DailyBriefStory, "illustrationData">,
  profile: EnrichedRotateProfile & {
    favouriteAnimal?: string | null;
    favouriteVehicle?: string | null;
    favouriteCharacter?: string | null;
    storyLearningTheme?: string | null;
    storyMoralPreference?: string | null;
  }
): Omit<DailyBriefStory, "illustrationData"> {
  const stage = profile.developmentStage;
  const child = profile.childNickname?.trim() || "your child";
  let reason = story.reason ?? "";
  if (reason && !reason.includes(stage)) {
    reason = reason.replace(
      /^Recommended because/i,
      `Recommended for ${profile.developmentStage} because`
    );
  }

  let personalizedStory = story.story.replace(/\{child\}/gi, child);
  const extras = [profile.favouriteAnimal, profile.favouriteVehicle, profile.favouriteCharacter]
    .filter(Boolean)
    .join(", ");
  if (extras && !personalizedStory.toLowerCase().includes(extras.split(",")[0]!.toLowerCase())) {
    personalizedStory = personalizedStory.replace(
      new RegExp(`\\b${child}\\b`, "i"),
      `${child} (who loves ${extras})`
    );
  }

  return {
    ...story,
    story: personalizedStory,
    title: story.title.replace(/\{child\}/gi, child),
    theme: profile.storyLearningTheme ?? story.theme,
    moral: profile.storyMoralPreference ?? story.moral,
    reason,
    ageSuitability: profile.childAgeDisplay ?? story.ageSuitability,
  };
}

export function personalizeLanguage(
  tip: DailyBriefDevelopment,
  profile: EnrichedRotateProfile
): DailyBriefDevelopment {
  const child = profile.childNickname?.trim() || "your child";
  const stage = profile.developmentStage;
  let reason = tip.reason ?? "";
  if (reason && !reason.includes(child)) {
    reason = reason.replace(
      /^Recommended because/i,
      `Recommended for ${child} at ${stage} because`
    );
  }
  let insight = tip.insight;
  if (profile.ageYears !== null && profile.ageYears < 2) {
    insight = insight.replace("Many children around this age", "At this stage, many little ones");
  }
  return { ...tip, reason, insight };
}
