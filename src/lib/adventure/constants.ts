import type { AdventureFormat, PosterTheme, RoutineChallenge, RoutineTemplateType, StoryTheme } from "@prisma/client";

export const FREE_ADVENTURE_LIMIT = 1;

export const STORY_THEME_OPTIONS: Array<{ value: StoryTheme; label: string; emoji: string }> = [
  { value: "ADVENTURE", label: "Adventure", emoji: "🗺️" },
  { value: "MISSION", label: "Mission", emoji: "🎯" },
  { value: "TREASURE_HUNT", label: "Treasure Hunt", emoji: "💎" },
  { value: "MAGIC", label: "Magic", emoji: "✨" },
  { value: "SPACE", label: "Space", emoji: "🚀" },
  { value: "SAFARI", label: "Safari", emoji: "🦁" },
  { value: "FANTASY", label: "Fantasy", emoji: "🏰" },
];

export const ADVENTURE_FORMAT_OPTIONS: Array<{
  value: AdventureFormat;
  label: string;
  description: string;
  premium?: boolean;
}> = [
  { value: "STORY_BOOK", label: "Story Book", description: "Mission pages like a picture book" },
  { value: "POSTER", label: "Poster", description: "Single wall poster" },
  { value: "FLOW_CHART", label: "Flow Chart", description: "Vertical step chart" },
  { value: "COMIC_STRIP", label: "Comic Strip", description: "Panel-by-panel comic", premium: true },
  { value: "ADVENTURE_CARDS", label: "Adventure Cards", description: "Cut-out mission cards", premium: true },
];

export const ADVENTURE_INTEREST_OPTIONS = [
  { value: "dinosaurs", label: "Dinosaurs", emoji: "🦕", theme: "DINOSAUR" as PosterTheme },
  { value: "fire_engines", label: "Fire Engines", emoji: "🚒", theme: "FIRE_ENGINE" as PosterTheme },
  { value: "princess", label: "Princess", emoji: "👑", theme: "PRINCESS" as PosterTheme },
  { value: "cars", label: "Cars", emoji: "🚗", theme: "CARS" as PosterTheme },
  { value: "construction", label: "Construction", emoji: "🚧", theme: "CONSTRUCTION" as PosterTheme },
  { value: "animals", label: "Animals", emoji: "🐾", theme: "ANIMALS" as PosterTheme },
  { value: "space", label: "Space", emoji: "🚀", theme: "SPACE" as PosterTheme },
  { value: "pirates", label: "Pirates", emoji: "🏴‍☠️", theme: "PIRATE" as PosterTheme },
  { value: "ocean", label: "Ocean", emoji: "🐬", theme: "OCEAN" as PosterTheme },
  { value: "unicorn", label: "Unicorn", emoji: "🦄", theme: "UNICORN" as PosterTheme },
];

export const ADVENTURE_CHALLENGE_OPTIONS: Array<{
  value: RoutineChallenge;
  label: string;
  emoji: string;
  template: RoutineTemplateType;
}> = [
  { value: "BEDTIME", label: "Bedtime", emoji: "🌙", template: "BEDTIME" },
  { value: "MORNING_CHAOS", label: "Morning", emoji: "🌅", template: "MORNING" },
  { value: "TOOTH_BRUSHING", label: "Brushing Teeth", emoji: "🪥", template: "BRUSHING_TEETH" },
  { value: "TRANSITIONS", label: "Bath", emoji: "🛁", template: "BEDTIME" },
  { value: "FOLLOWING_INSTRUCTIONS", label: "Cleaning Toys", emoji: "🧸", template: "CLEANING_UP" },
  { value: "POTTY_TRAINING", label: "Toilet Training", emoji: "🚽", template: "TOILET_TRAINING" },
  { value: "SCHOOL_PREP", label: "School", emoji: "🎒", template: "LEAVING_HOUSE" },
  { value: "EMOTIONAL_REGULATION", label: "Emotional Regulation", emoji: "💛", template: "EMOTIONAL_REGULATION" },
];

export const ADVENTURE_GOAL_OPTIONS = [
  { value: "CONFIDENCE", label: "Confidence", emoji: "🌟" },
  { value: "INDEPENDENCE", label: "Independence", emoji: "💪" },
  { value: "RESPONSIBILITY", label: "Responsibility", emoji: "✅" },
  { value: "SPEECH", label: "Speech", emoji: "🗣️" },
  { value: "HEALTHY_HABITS", label: "Healthy Habits", emoji: "🥗" },
  { value: "EMOTIONAL_REGULATION", label: "Emotional Regulation", emoji: "💛" },
] as const;

/** Large illustration emoji per mission type */
export const MISSION_ILLUSTRATIONS: Record<string, string> = {
  teeth: "🦷",
  brush: "🪥",
  bath: "🛁",
  pyjama: "👕",
  dress: "👕",
  sleep: "😴",
  story: "📖",
  toilet: "🚽",
  breakfast: "🍳",
  school: "🎒",
  clean: "🧸",
  default: "⭐",
};

export function missionIllustrationEmoji(title: string, fallback: string): string {
  const t = title.toLowerCase();
  if (t.includes("teeth") || t.includes("brush")) return MISSION_ILLUSTRATIONS.teeth;
  if (t.includes("bath")) return MISSION_ILLUSTRATIONS.bath;
  if (t.includes("pyjama") || t.includes("dress")) return MISSION_ILLUSTRATIONS.pyjama;
  if (t.includes("sleep") || t.includes("bed")) return MISSION_ILLUSTRATIONS.sleep;
  if (t.includes("story") || t.includes("book")) return MISSION_ILLUSTRATIONS.story;
  if (t.includes("toilet") || t.includes("potty")) return MISSION_ILLUSTRATIONS.toilet;
  if (t.includes("clean") || t.includes("toy")) return MISSION_ILLUSTRATIONS.clean;
  return fallback || MISSION_ILLUSTRATIONS.default;
}
