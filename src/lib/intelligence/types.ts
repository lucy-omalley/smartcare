import type { BriefProfile } from "@/lib/daily-brief-context";
import type { PlanContext } from "@/lib/knowledge/repository";
import type { WeatherInfo } from "@/types/daily-brief";
import type { AIMemorySignals } from "@/lib/services/today-recommendation-engine";

export type CandidateKind = "recipe" | "activity" | "story" | "tip" | "milestone" | "weekly";

export interface PlanHistory {
  previousRecipeSlugs?: string[];
  previousActivitySlugs?: string[];
  previousStorySlugs?: string[];
}

export interface PlanSignals {
  profile: BriefProfile;
  ctx: PlanContext;
  memory: AIMemorySignals;
  developmentStage: string;
  /** Normalised lowercase tokens for matching */
  interests: string[];
  goals: string[];
  challenges: string[];
  favouriteFoods: string[];
  foodDislikes: string[];
  previousRecipeSlugs: string[];
  previousActivitySlugs: string[];
  previousStorySlugs: string[];
  weekday: number;
  isWeekend: boolean;
  isRainy: boolean;
  isSunny: boolean;
  weather: WeatherInfo | null;
}

export interface ScoreFactor {
  id: string;
  label: string;
  weight: number;
  raw: number;
  weighted: number;
}

export interface ScoredCandidate<T extends { slug: string }> {
  item: T;
  kind: CandidateKind;
  total: number;
  factors: ScoreFactor[];
  disqualified?: boolean;
  disqualifyReason?: string;
}

export interface RankedPlanPicks {
  recipeSlug?: string;
  activitySlug?: string;
  storySlug?: string;
  tipSlug?: string;
  milestoneSlug?: string;
  reasons: {
    recipe?: string;
    activity?: string;
    story?: string;
    tip?: string;
    milestone?: string;
  };
}

export interface ScorableRecipe {
  slug: string;
  subtitle: string;
  ingredients: string[];
  tags: string[];
  minAgeMonths: number;
  maxAgeMonths: number;
  whyThisMeal: string | null;
  nutritionTags: string[];
}

export interface ScorableActivity {
  slug: string;
  title: string;
  tags: string[];
  minAgeMonths: number;
  maxAgeMonths: number;
  indoorOutdoor: string;
  rainyDay: boolean;
  sunnyDay: boolean;
  skillsDeveloped: string[];
  materials: string[];
  reason: string | null;
}

export interface ScorableStory {
  slug: string;
  theme: string;
  tags: string[];
  minAgeMonths: number;
  maxAgeMonths: number;
  titleTemplate: string;
}

export interface ScorableTip {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  tryToday: string | null;
  minAgeMonths: number;
  maxAgeMonths: number;
}

export interface ScorableMilestone {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  minAgeMonths: number;
  maxAgeMonths: number;
}

export interface ScorableWeeklyTheme {
  slug: string;
  title: string;
  reason: string;
  domain: string;
  tags: string[];
  minAgeMonths: number;
  maxAgeMonths: number;
}

export interface RankedWeeklyFocusPick {
  themeSlug: string;
  title: string;
  reason: string;
  scored?: ScoredCandidate<ScorableWeeklyTheme>;
}

export interface KnowledgeScoringPool {
  recipes: ScorableRecipe[];
  activities: ScorableActivity[];
  stories: ScorableStory[];
  tips: ScorableTip[];
  milestones: ScorableMilestone[];
}
