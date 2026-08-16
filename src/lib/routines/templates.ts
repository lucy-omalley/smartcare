import type { RoutineTemplateType } from "@prisma/client";
import type { RoutineStepPayload } from "@/types/visual-routine";
import { stepCountForLength } from "@/lib/routines/constants";
import type { RoutineLength } from "@prisma/client";

type TemplateFactory = (childName: string, stepCount: number) => RoutineStepPayload[];

function themedTitle(base: string, interest?: string): string {
  if (!interest) return base;
  const map: Record<string, string> = {
    dinosaurs: "🦕 Dino",
    cars: "🚗 Race Car",
    princesses: "👑 Royal",
    animals: "🐾 Animal",
    space: "🚀 Space",
    superheroes: "🦸 Hero",
  };
  const prefix = map[interest.toLowerCase()];
  return prefix ? `${prefix} ${base}` : base;
}

const TEMPLATE_STEPS: Partial<Record<RoutineTemplateType, TemplateFactory>> = {
  MORNING: (name, n) => {
    const all: RoutineStepPayload[] = [
      { title: "Wake Up Stretch", instruction: `Good morning, ${name}! Let's stretch like a tall tree.`, iconEmoji: "🌅", durationMinutes: 1, rewardEmoji: "⭐" },
      { title: "Bathroom Visit", instruction: "Time for a quick bathroom trip.", iconEmoji: "🚽", durationMinutes: 2, rewardEmoji: "⭐" },
      { title: "Get Dressed", instruction: "Pick your outfit — you've got this!", iconEmoji: "👕", durationMinutes: 3, rewardEmoji: "⭐" },
      { title: "Brush Teeth", instruction: "Make those teeth sparkle!", iconEmoji: "🪥", durationMinutes: 2, rewardEmoji: "⭐" },
      { title: "Healthy Breakfast", instruction: "Fuel up for a great day.", iconEmoji: "🥣", durationMinutes: 10, rewardEmoji: "⭐" },
      { title: "Pack Bag", instruction: "What's going with you today?", iconEmoji: "🎒", durationMinutes: 2, rewardEmoji: "⭐" },
      { title: "Shoes On", instruction: "Ready, set, go!", iconEmoji: "👟", durationMinutes: 2, rewardEmoji: "⭐" },
    ];
    return all.slice(0, n);
  },
  BEDTIME: (name, n) => {
    const all: RoutineStepPayload[] = [
      { title: "Tidy Up", instruction: "Let's put toys to sleep too.", iconEmoji: "🧸", durationMinutes: 3, rewardEmoji: "⭐" },
      { title: "Pajamas", instruction: "Cosy pyjama time!", iconEmoji: "🌙", durationMinutes: 2, rewardEmoji: "⭐" },
      { title: "Brush Teeth", instruction: "Night-time sparkle for your teeth.", iconEmoji: "🪥", durationMinutes: 2, rewardEmoji: "⭐" },
      { title: "Calm Down", instruction: "Three deep breaths together.", iconEmoji: "💛", durationMinutes: 2, rewardEmoji: "⭐" },
      { title: "Story Time", instruction: `${name}, time for a magical story.`, iconEmoji: "📖", durationMinutes: 10, rewardEmoji: "🌟", isStoryTimeStep: true },
      { title: "Goodnight Hug", instruction: "Sweet dreams, superstar.", iconEmoji: "💤", durationMinutes: 1, rewardEmoji: "⭐" },
    ];
    return all.slice(0, n);
  },
  BRUSHING_TEETH: (name, n) => {
    const all: RoutineStepPayload[] = [
      { title: "Pick Your Toothbrush", instruction: "Your special brushing tool!", iconEmoji: "🪥", durationMinutes: 1, rewardEmoji: "⭐" },
      { title: "Squeeze Paste", instruction: "Pea-sized is perfect.", iconEmoji: "✨", durationMinutes: 1, rewardEmoji: "⭐" },
      { title: "Brush Top Teeth", instruction: "Round and round on top!", iconEmoji: "😁", durationMinutes: 1, rewardEmoji: "⭐" },
      { title: "Brush Bottom Teeth", instruction: "Don't forget the bottom!", iconEmoji: "😁", durationMinutes: 1, rewardEmoji: "⭐" },
      { title: "Rinse & Smile", instruction: `Show ${name} that shiny smile!`, iconEmoji: "🌟", durationMinutes: 1, rewardEmoji: "🏆" },
    ];
    return all.slice(0, n);
  },
  CLEANING_UP: (name, n) => {
    const all: RoutineStepPayload[] = [
      { title: "Pick a Song", instruction: "Let's tidy to music!", iconEmoji: "🎵", durationMinutes: 1, rewardEmoji: "⭐" },
      { title: "Blocks Away", instruction: "Blocks go in the box.", iconEmoji: "🧱", durationMinutes: 2, rewardEmoji: "⭐" },
      { title: "Books on Shelf", instruction: "Stories back to their home.", iconEmoji: "📚", durationMinutes: 2, rewardEmoji: "⭐" },
      { title: "Toys in Basket", instruction: "High five for helpers!", iconEmoji: "🧸", durationMinutes: 3, rewardEmoji: "🏆" },
    ];
    return all.slice(0, n);
  },
};

export function buildTemplateRoutine(params: {
  templateType: RoutineTemplateType;
  childName: string;
  length: RoutineLength;
  primaryInterest?: string;
}): { title: string; steps: RoutineStepPayload[] } {
  const stepCount = stepCountForLength(params.length);
  const factory = TEMPLATE_STEPS[params.templateType];
  const meta = params.templateType;

  if (!factory) {
    return {
      title: `${params.childName}'s Routine`,
      steps: [
        { title: "Step 1", instruction: "Let's get started!", iconEmoji: "⭐", durationMinutes: 2, rewardEmoji: "⭐" },
        { title: "Step 2", instruction: "Keep going — you're doing great!", iconEmoji: "🌟", durationMinutes: 2, rewardEmoji: "⭐" },
        { title: "All Done", instruction: "Celebration time!", iconEmoji: "🎉", durationMinutes: 1, rewardEmoji: "🏆" },
      ].slice(0, stepCount),
    };
  }

  const steps = factory(params.childName, stepCount).map((s) => ({
    ...s,
    title: themedTitle(s.title, params.primaryInterest),
  }));

  const titles: Partial<Record<RoutineTemplateType, string>> = {
    MORNING: `${params.childName}'s Morning Adventure`,
    BEDTIME: `${params.childName}'s Bedtime Journey`,
    BRUSHING_TEETH: `${params.childName}'s Sparkle Time`,
    CLEANING_UP: `${params.childName}'s Tidy Team`,
  };

  return {
    title: titles[params.templateType] ?? `${params.childName}'s Routine`,
    steps,
  };
}
