import { parseChildAgeMonths } from "@/lib/child-development";
import {
  ADVENTURE_COLLECTIONS,
  adventureMatchesCollection,
} from "@/lib/family-adventures/collections";
import { fetchAllAdventures } from "@/lib/family-adventures/connectors";
import type {
  AdventureFilters,
  FamilyAdventure,
  RecommendedAdventure,
} from "@/lib/family-adventures/types";

export type RecommendationContext = {
  childAgeMonths: number | null;
  childName: string;
  interests: string[];
  favouriteToys: string[];
  weeklyFocus?: string | null;
  isRainy: boolean;
  isWeekend: boolean;
  savedIds: string[];
  attendedTitles: string[];
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function matchesAge(adventure: FamilyAdventure, ageMonths: number | null): boolean {
  if (ageMonths === null) return true;
  return ageMonths >= adventure.ageMinMonths - 6 && ageMonths <= adventure.ageMaxMonths + 12;
}

function interestHaystack(ctx: RecommendationContext): string {
  return [...ctx.interests, ...ctx.favouriteToys, ctx.weeklyFocus ?? ""]
    .join(" ")
    .toLowerCase();
}

function scoreAdventure(adventure: FamilyAdventure, ctx: RecommendationContext): RecommendedAdventure {
  let score = 50;
  const why: string[] = [];
  const haystack = interestHaystack(ctx);

  if (!matchesAge(adventure, ctx.childAgeMonths)) {
    score -= 40;
  } else {
    score += 12;
    why.push(`Perfect for ${adventure.ageLabel}`);
  }

  for (const tag of adventure.interestTags) {
    if (haystack.includes(tag.toLowerCase())) {
      score += 14;
      if (tag === "trains" && ctx.childName) {
        why.push(`${ctx.childName} loves trains`);
      } else if (tag === "animals") {
        why.push("Matches animal interests");
      } else {
        why.push(`Matches ${tag} interests`);
      }
      break;
    }
  }

  if (ctx.weeklyFocus) {
    const focus = ctx.weeklyFocus.toLowerCase();
    if (
      adventure.learningSkills.some((s) => focus.includes(s.toLowerCase().split(" ")[0] ?? "")) ||
      adventure.interestTags.some((t) => focus.includes(t))
    ) {
      score += 12;
      why.push("Matches this week's learning goal");
    }
  }

  if (ctx.isRainy) {
    if (adventure.indoorOutdoor === "indoor" || adventure.rainSuitable) {
      score += 18;
      why.push("Great for rainy weather");
    } else if (adventure.indoorOutdoor === "outdoor" && !adventure.rainSuitable) {
      score -= 25;
    }
  } else if (adventure.indoorOutdoor === "outdoor" || adventure.indoorOutdoor === "either") {
    score += 10;
    why.push("Sunny weather — perfect outdoors");
  }

  if (adventure.distanceKm <= 5) {
    score += 10;
    why.push(`Only ${adventure.travelMinutes} minutes away`);
  } else if (adventure.distanceKm <= 12) {
    score += 5;
    why.push(`${adventure.distanceKm} km — easy trip`);
  }

  if (adventure.isFree) {
    score += 6;
    if (!why.some((w) => w.includes("Free"))) why.push("Free entry");
  }

  if (ctx.attendedTitles.some((t) => t.toLowerCase() === adventure.title.toLowerCase())) {
    score -= 30;
  }

  if (ctx.savedIds.includes(adventure.id)) {
    score += 4;
  }

  if (adventure.location === "At home" && !ctx.isRainy) {
    score -= 20;
  }
  if (adventure.location === "At home" && ctx.isRainy) {
    score += 25;
    if (!why.length) why.push("Cosy rainy-day alternative");
  }

  const collectionIds = ADVENTURE_COLLECTIONS.filter((c) =>
    adventureMatchesCollection(
      c.id,
      adventure.interestTags,
      adventure.isFree,
      adventure.indoorOutdoor,
      adventure.ageMinMonths
    )
  ).map((c) => c.id);

  const matchScore = clamp(score);
  const matchStars = Math.min(5, Math.max(1, Math.round(matchScore / 20)));

  const uniqueWhy = Array.from(new Set(why)).slice(0, 4);
  if (uniqueWhy.length === 0) {
    uniqueWhy.push("A lovely match for your family today");
  }

  return {
    ...adventure,
    matchScore,
    matchStars,
    whyRecommended: uniqueWhy,
    collectionIds,
  };
}

function applyFilters(adventures: RecommendedAdventure[], filters?: AdventureFilters): RecommendedAdventure[] {
  if (!filters) return adventures;

  return adventures.filter((a) => {
    if (filters.maxDistanceKm != null && a.distanceKm > filters.maxDistanceKm) return false;
    if (filters.freeOnly && !a.isFree) return false;
    if (filters.indoor && a.indoorOutdoor === "outdoor") return false;
    if (filters.outdoor && a.indoorOutdoor === "indoor" && a.location !== "At home") return false;
    if (filters.wheelchair && !a.wheelchairAccess) return false;
    if (filters.babyFriendly && !a.babyFacilities) return false;
    if (filters.maxDurationMinutes != null && a.durationMinutes > filters.maxDurationMinutes) return false;
    if (filters.collectionId && !a.collectionIds.includes(filters.collectionId)) return false;
    return true;
  });
}

export async function recommendFamilyAdventures(
  ctx: RecommendationContext,
  filters?: AdventureFilters,
  limit = 3
): Promise<RecommendedAdventure[]> {
  const all = await fetchAllAdventures();
  const scored = all
    .map((a) => scoreAdventure(a, ctx))
    .sort((a, b) => b.matchScore - a.matchScore);

  const filtered = applyFilters(scored, filters);
  const pool = filtered.length >= limit ? filtered : scored;

  return pool.slice(0, limit);
}

export function buildHeroMessage(isRainy: boolean, count: number): string {
  if (isRainy) {
    return count > 0
      ? "Rainy day? We found cosy indoor adventures for you."
      : "Rainy day — explore indoor ideas and home adventures.";
  }
  return count > 0
    ? "Today looks perfect for a family adventure."
    : "Discover personalised experiences near you.";
}

export function buildRecommendationContext(user: {
  childNickname?: string | null;
  childAge?: string | null;
  childBirthday?: string | null;
  childInterests?: string[];
  favouriteToys?: string[];
  weeklyFocusTitle?: string | null;
  favouriteAnimal?: string | null;
  favouriteVehicle?: string | null;
}): RecommendationContext {
  const interests = [
    ...(user.childInterests ?? []),
    ...(user.favouriteToys ?? []),
    user.favouriteAnimal,
    user.favouriteVehicle,
  ].filter(Boolean) as string[];

  return {
    childAgeMonths: parseChildAgeMonths(user.childAge, user.childBirthday),
    childName: user.childNickname ?? "your child",
    interests,
    favouriteToys: user.favouriteToys ?? [],
    weeklyFocus: user.weeklyFocusTitle,
    isRainy: false,
    isWeekend: [0, 6].includes(new Date().getDay()),
    savedIds: [],
    attendedTitles: [],
  };
}
