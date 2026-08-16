import type { PosterCategory, PosterLayout, PosterParentGoal, PosterTheme, RoutineTemplateType } from "@prisma/client";

export const FREE_POSTER_LIMIT = 1;
export const FREE_THEME_COUNT = 3;

/** Free tier themes — premium unlocks all */
export const FREE_POSTER_THEMES: PosterTheme[] = ["DINOSAUR", "UNICORN", "ANIMALS"];

export const POSTER_LAYOUT_META: Record<
  PosterLayout,
  { label: string; description: string; widthMm: number; heightMm: number; premium?: boolean }
> = {
  A4_PORTRAIT: { label: "A4 Portrait", description: "Classic bedroom wall poster", widthMm: 210, heightMm: 297 },
  A4_LANDSCAPE: { label: "A4 Landscape", description: "Wide fridge-friendly layout", widthMm: 297, heightMm: 210 },
  A3_POSTER: { label: "A3 Poster", description: "Large statement poster", widthMm: 297, heightMm: 420, premium: true },
  FRIDGE_CARD: { label: "Fridge Card", description: "Compact magnetic card size", widthMm: 148, heightMm: 210 },
  MINI_TRAVEL: { label: "Mini Travel Card", description: "Pocket-sized on-the-go", widthMm: 105, heightMm: 148 },
  WEEKLY_PLANNER: { label: "Weekly Planner", description: "7-day habit tracker", widthMm: 210, heightMm: 297, premium: true },
};

export const POSTER_CATEGORY_OPTIONS: Array<{ value: PosterCategory; label: string; emoji: string }> = [
  { value: "MORNING", label: "Morning", emoji: "🌅" },
  { value: "BEDTIME", label: "Bedtime", emoji: "🌙" },
  { value: "WEEKEND", label: "Weekend", emoji: "🎉" },
  { value: "SCHOOL", label: "School", emoji: "🎒" },
  { value: "HOLIDAY", label: "Holiday", emoji: "🏖️" },
  { value: "CUSTOM", label: "Custom", emoji: "✨" },
];

export const POSTER_GOAL_OPTIONS: Array<{ value: PosterParentGoal; label: string; emoji: string }> = [
  { value: "INDEPENDENCE", label: "Independence", emoji: "💪" },
  { value: "CONFIDENCE", label: "Confidence", emoji: "🌟" },
  { value: "SPEECH", label: "Speech", emoji: "🗣️" },
  { value: "EMOTIONAL_REGULATION", label: "Emotional Regulation", emoji: "💛" },
  { value: "HEALTHY_HABITS", label: "Healthy Habits", emoji: "🥗" },
  { value: "RESPONSIBILITY", label: "Responsibility", emoji: "✅" },
];

export const POSTER_COLOUR_OPTIONS = [
  { value: "blue", label: "Blue", hex: "#3B82F6" },
  { value: "pink", label: "Pink", hex: "#EC4899" },
  { value: "green", label: "Green", hex: "#22C55E" },
  { value: "yellow", label: "Yellow", hex: "#EAB308" },
  { value: "purple", label: "Purple", hex: "#A855F7" },
  { value: "orange", label: "Orange", hex: "#F97316" },
] as const;

export const POSTER_TEMPLATE_LABELS: Partial<Record<RoutineTemplateType, string>> = {
  MORNING: "Morning Routine",
  BEDTIME: "Bedtime Routine",
  AFTER_SCHOOL: "After School",
  LEAVING_HOUSE: "Leaving Home",
  TOILET_TRAINING: "Toilet Training",
  MEAL_TIME: "Meal Time",
  HOMEWORK: "Homework",
  CLEANING_UP: "Cleaning Up",
  SCREEN_TIME: "Screen Time",
  EMOTIONAL_REGULATION: "Calm Down Routine",
  GETTING_DRESSED: "Getting Dressed",
  BRUSHING_TEETH: "Brushing Teeth",
  CUSTOM: "Custom Routine",
};

export const STEP_ICON_OPTIONS = [
  "🚽", "🪥", "👕", "👟", "🍳", "🥣", "🎒", "🚗", "🛏️", "📚", "🧸", "🎵",
  "⭐", "🌟", "💧", "🧼", "🪞", "🎨", "🚿", "🦷", "🧴", "🎮", "📱", "💤",
  "🌞", "🌙", "🦕", "🚀", "🦄", "🐬", "🏰", "🚒", "🐘", "🏴‍☠️", "✨", "🎉",
] as const;

export function categoryForTemplate(template: RoutineTemplateType): PosterCategory {
  switch (template) {
    case "MORNING":
    case "GETTING_DRESSED":
    case "BRUSHING_TEETH":
      return "MORNING";
    case "BEDTIME":
      return "BEDTIME";
    case "AFTER_SCHOOL":
    case "HOMEWORK":
    case "LEAVING_HOUSE":
      return "SCHOOL";
    default:
      return "CUSTOM";
  }
}
