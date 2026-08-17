import type { ToyCategory } from "@prisma/client";
import type { ActivityFilter } from "@/types/toy-brain";

export const FREE_TOY_SCANS_PER_MONTH = 3;
export const FREE_ACTIVITIES_PER_TOY = 5;
export const PREMIUM_ACTIVITIES_PER_TOY = 10;

export const TOY_CATEGORY_OPTIONS: Array<{
  value: ToyCategory;
  label: string;
  emoji: string;
  group: string;
}> = [
  { value: "LEGO", label: "LEGO", emoji: "🧱", group: "Construction" },
  { value: "DUPLO", label: "Duplo", emoji: "🟢", group: "Construction" },
  { value: "MAGNETIC_TILES", label: "Magnetic Tiles", emoji: "🔷", group: "Construction" },
  { value: "BUILDING_BLOCKS", label: "Building Blocks", emoji: "🪵", group: "Construction" },
  { value: "PLAY_DOH", label: "Play-Doh", emoji: "🎨", group: "Creative" },
  { value: "ART_SUPPLIES", label: "Art Supplies", emoji: "🖍️", group: "Creative" },
  { value: "TOY_CARS", label: "Toy Cars", emoji: "🚗", group: "Vehicles" },
  { value: "TRAIN_SETS", label: "Train Sets", emoji: "🚂", group: "Vehicles" },
  { value: "ANIMAL_FIGURES", label: "Animal Figures", emoji: "🦁", group: "Pretend Play" },
  { value: "DOLLS", label: "Dolls", emoji: "👧", group: "Pretend Play" },
  { value: "KITCHEN_SETS", label: "Kitchen Sets", emoji: "🍳", group: "Pretend Play" },
  { value: "PRETEND_PLAY", label: "Pretend Play", emoji: "🎭", group: "Pretend Play" },
  { value: "PUZZLE", label: "Puzzle", emoji: "🧩", group: "Educational" },
  { value: "BOOKS", label: "Books", emoji: "📚", group: "Educational" },
  { value: "MUSICAL_TOYS", label: "Musical Toys", emoji: "🎵", group: "Music" },
  { value: "BALLS", label: "Balls", emoji: "⚽", group: "Outdoor" },
  { value: "UNKNOWN", label: "Other Toy", emoji: "🧸", group: "Other" },
];

export const TOY_CATEGORY_GROUPS = [
  "Construction",
  "Creative",
  "Vehicles",
  "Pretend Play",
  "Educational",
  "Music",
  "Outdoor",
  "Other",
] as const;

export const ACTIVITY_FILTER_OPTIONS: Array<{ value: ActivityFilter; label: string; emoji: string }> = [
  { value: "5min", label: "5 mins", emoji: "⏱️" },
  { value: "10min", label: "10 mins", emoji: "⏱️" },
  { value: "20min", label: "20 mins", emoji: "⏱️" },
  { value: "30min", label: "30 mins", emoji: "⏱️" },
  { value: "indoor", label: "Indoor", emoji: "🏠" },
  { value: "outdoor", label: "Outdoor", emoji: "🌳" },
  { value: "mess_free", label: "Mess free", emoji: "✨" },
  { value: "rainy_day", label: "Rainy day", emoji: "🌧️" },
  { value: "quick_setup", label: "Quick setup", emoji: "⚡" },
  { value: "montessori", label: "Montessori", emoji: "🌱" },
  { value: "stem", label: "STEM", emoji: "🔬" },
  { value: "language", label: "Language", emoji: "🗣️" },
];

export const SKILL_BADGE_LABELS: Record<string, string> = {
  speech: "Speech",
  vocabulary: "Vocabulary",
  counting: "Counting",
  creativity: "Creativity",
  fine_motor: "Fine Motor",
  gross_motor: "Gross Motor",
  emotional_regulation: "Emotional Regulation",
  sharing: "Sharing",
  turn_taking: "Turn Taking",
  problem_solving: "Problem Solving",
  confidence: "Confidence",
  executive_function: "Executive Function",
};

export function categoryMeta(category: ToyCategory) {
  return TOY_CATEGORY_OPTIONS.find((c) => c.value === category) ?? TOY_CATEGORY_OPTIONS.find((c) => c.value === "UNKNOWN")!;
}
