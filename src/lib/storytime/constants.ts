import type { BedtimeMood, StoryCategory } from "@prisma/client";

export const STORY_CATEGORIES: Array<{ value: StoryCategory; label: string; emoji: string }> = [
  { value: "ADVENTURE", label: "Adventure", emoji: "🗺️" },
  { value: "FRIENDSHIP", label: "Friendship", emoji: "🤝" },
  { value: "KINDNESS", label: "Kindness", emoji: "💛" },
  { value: "SHARING", label: "Sharing", emoji: "🎁" },
  { value: "CONFIDENCE", label: "Confidence", emoji: "⭐" },
  { value: "EMOTIONS", label: "Emotions", emoji: "😊" },
  { value: "NATURE", label: "Nature", emoji: "🌿" },
  { value: "ANIMALS", label: "Animals", emoji: "🐾" },
  { value: "DINOSAURS", label: "Dinosaurs", emoji: "🦕" },
  { value: "VEHICLES", label: "Vehicles", emoji: "🚂" },
  { value: "SPACE", label: "Space", emoji: "🚀" },
  { value: "FANTASY", label: "Fantasy", emoji: "✨" },
  { value: "FAMILY", label: "Family", emoji: "🏠" },
  { value: "SCHOOL", label: "School", emoji: "🎒" },
  { value: "HOLIDAY", label: "Holiday", emoji: "🎄" },
  { value: "BIRTHDAY", label: "Birthday", emoji: "🎂" },
  { value: "CUSTOM", label: "Custom", emoji: "📝" },
];

export const BEDTIME_MOODS: Array<{ value: BedtimeMood; label: string }> = [
  { value: "CALM", label: "Calm & sleepy" },
  { value: "COSY", label: "Cosy & warm" },
  { value: "PLAYFUL", label: "Playful & gentle" },
  { value: "ADVENTUROUS", label: "Soft adventure" },
];

export const STORY_LENGTH_OPTIONS = [
  { value: 2, label: "2 min" },
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
] as const;

export function categoryLabel(category: StoryCategory): string {
  return STORY_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function categoryEmoji(category: StoryCategory): string {
  return STORY_CATEGORIES.find((c) => c.value === category)?.emoji ?? "📖";
}
