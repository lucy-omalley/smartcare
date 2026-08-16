import type { RoutineChallenge, RoutineLength, RoutineTemplateType } from "@prisma/client";

export const FREE_ROUTINE_LIMIT = 3;

export const ROUTINE_TEMPLATE_META: Record<
  RoutineTemplateType,
  { label: string; emoji: string; description: string }
> = {
  MORNING: { label: "Morning Routine", emoji: "🌅", description: "Start the day with calm confidence" },
  BEDTIME: { label: "Bedtime Routine", emoji: "🌙", description: "Wind down peacefully for sleep" },
  AFTER_SCHOOL: { label: "After School", emoji: "🎒", description: "Transition from school to home" },
  MEAL_TIME: { label: "Meal Time", emoji: "🍽️", description: "Sit, eat, and enjoy together" },
  TOILET_TRAINING: { label: "Toilet Training", emoji: "🚽", description: "Build bathroom independence" },
  BRUSHING_TEETH: { label: "Brushing Teeth", emoji: "🪥", description: "Sparkling teeth routine" },
  GETTING_DRESSED: { label: "Getting Dressed", emoji: "👕", description: "Independent dressing steps" },
  CLEANING_UP: { label: "Cleaning Up Toys", emoji: "🧸", description: "Tidy time made fun" },
  EMOTIONAL_REGULATION: { label: "Emotional Regulation", emoji: "💛", description: "Calm big feelings together" },
  HOMEWORK: { label: "Homework", emoji: "📚", description: "Focus time for learning" },
  LEAVING_HOUSE: { label: "Leaving the House", emoji: "🚪", description: "Get out the door smoothly" },
  SCREEN_TIME: { label: "Screen Time Transition", emoji: "📱", description: "Gentle on/off screen flow" },
  CUSTOM: { label: "Custom Routine", emoji: "✨", description: "Build your own from scratch" },
};

export const ROUTINE_CHALLENGE_OPTIONS: Array<{ value: RoutineChallenge; label: string; emoji: string }> = [
  { value: "BEDTIME", label: "Bedtime", emoji: "🌙" },
  { value: "TRANSITIONS", label: "Transitions", emoji: "🔀" },
  { value: "TOOTH_BRUSHING", label: "Tooth Brushing", emoji: "🪥" },
  { value: "EMOTIONAL_REGULATION", label: "Emotional Regulation", emoji: "💛" },
  { value: "MORNING_CHAOS", label: "Morning Chaos", emoji: "⏰" },
  { value: "SCHOOL_PREP", label: "School Preparation", emoji: "🎒" },
];

export const ROUTINE_LENGTH_OPTIONS: Array<{ value: RoutineLength; label: string; stepHint: string }> = [
  { value: "SHORT", label: "Short", stepHint: "3–4 steps" },
  { value: "MEDIUM", label: "Medium", stepHint: "5–7 steps" },
  { value: "LONG", label: "Long", stepHint: "8–10 steps" },
];

export const ROUTINE_INTEREST_OPTIONS = [
  { value: "cars", label: "Cars", emoji: "🚗" },
  { value: "dinosaurs", label: "Dinosaurs", emoji: "🦕" },
  { value: "princesses", label: "Princesses", emoji: "👑" },
  { value: "animals", label: "Animals", emoji: "🐾" },
  { value: "space", label: "Space", emoji: "🚀" },
  { value: "superheroes", label: "Superheroes", emoji: "🦸" },
] as const;

export function stepCountForLength(length: RoutineLength): number {
  switch (length) {
    case "SHORT":
      return 4;
    case "LONG":
      return 9;
    default:
      return 6;
  }
}
