import type { PosterTheme } from "@prisma/client";

/**
 * Illustration Service — future-ready for AI-generated artwork.
 * Currently maps theme + step context to curated illustration keys.
 */
export type IllustrationKey = string;

const THEME_ILLUSTRATIONS: Record<PosterTheme, Record<string, IllustrationKey>> = {
  DINOSAUR: {
    toilet: "dino-toilet",
    teeth: "dino-teeth",
    dress: "dino-dress",
    breakfast: "dino-breakfast",
    school: "dino-backpack",
    sleep: "dino-sleep",
    clean: "dino-toys",
    story: "dino-story",
    default: "dino-star",
  },
  FIRE_ENGINE: {
    toilet: "fire-toilet",
    teeth: "fire-teeth",
    dress: "fire-uniform",
    breakfast: "fire-meal",
    school: "fire-gear",
    sleep: "fire-rest",
    clean: "fire-tidy",
    story: "fire-story",
    default: "fire-badge",
  },
  SPACE: {
    toilet: "space-toilet",
    teeth: "space-teeth",
    dress: "space-suit",
    breakfast: "space-meal",
    school: "space-launch",
    sleep: "space-sleep",
    clean: "space-tidy",
    story: "space-story",
    default: "space-star",
  },
  PRINCESS: {
    toilet: "princess-toilet",
    teeth: "princess-teeth",
    dress: "princess-dress",
    breakfast: "princess-feast",
    school: "princess-crown",
    sleep: "princess-sleep",
    clean: "princess-tidy",
    story: "princess-story",
    default: "princess-star",
  },
  UNICORN: {
    toilet: "unicorn-toilet",
    teeth: "unicorn-teeth",
    dress: "unicorn-dress",
    breakfast: "unicorn-meal",
    school: "unicorn-backpack",
    sleep: "unicorn-sleep",
    clean: "unicorn-tidy",
    story: "unicorn-story",
    default: "unicorn-star",
  },
  ANIMALS: {
    toilet: "animal-toilet",
    teeth: "animal-teeth",
    dress: "animal-dress",
    breakfast: "animal-meal",
    school: "animal-backpack",
    sleep: "animal-sleep",
    clean: "animal-tidy",
    story: "animal-story",
    default: "animal-star",
  },
  CARS: {
    toilet: "car-toilet",
    teeth: "car-teeth",
    dress: "car-jacket",
    breakfast: "car-meal",
    school: "car-drive",
    sleep: "car-park",
    clean: "car-garage",
    story: "car-story",
    default: "car-flag",
  },
  CONSTRUCTION: {
    toilet: "build-toilet",
    teeth: "build-teeth",
    dress: "build-helmet",
    breakfast: "build-meal",
    school: "build-tools",
    sleep: "build-rest",
    clean: "build-tidy",
    story: "build-story",
    default: "build-star",
  },
  OCEAN: {
    toilet: "ocean-toilet",
    teeth: "ocean-teeth",
    dress: "ocean-swim",
    breakfast: "ocean-meal",
    school: "ocean-wave",
    sleep: "ocean-sleep",
    clean: "ocean-tidy",
    story: "ocean-story",
    default: "ocean-dolphin",
  },
  FAIRY: {
    toilet: "fairy-toilet",
    teeth: "fairy-teeth",
    dress: "fairy-wings",
    breakfast: "fairy-meal",
    school: "fairy-wand",
    sleep: "fairy-sleep",
    clean: "fairy-tidy",
    story: "fairy-story",
    default: "fairy-star",
  },
  PIRATE: {
    toilet: "pirate-toilet",
    teeth: "pirate-teeth",
    dress: "pirate-outfit",
    breakfast: "pirate-feast",
    school: "pirate-map",
    sleep: "pirate-sleep",
    clean: "pirate-tidy",
    story: "pirate-story",
    default: "pirate-treasure",
  },
  SAFARI: {
    toilet: "safari-toilet",
    teeth: "safari-teeth",
    dress: "safari-outfit",
    breakfast: "safari-meal",
    school: "safari-binoculars",
    sleep: "safari-sleep",
    clean: "safari-tidy",
    story: "safari-story",
    default: "safari-elephant",
  },
};

function inferStepCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("toilet") || t.includes("potty") || t.includes("wee") || t.includes("bathroom")) return "toilet";
  if (t.includes("teeth") || t.includes("brush")) return "teeth";
  if (t.includes("dress") || t.includes("clothes") || t.includes("outfit")) return "dress";
  if (t.includes("breakfast") || t.includes("eat") || t.includes("meal") || t.includes("snack")) return "breakfast";
  if (t.includes("school") || t.includes("backpack") || t.includes("leave") || t.includes("door")) return "school";
  if (t.includes("bed") || t.includes("sleep") || t.includes("pyjama")) return "sleep";
  if (t.includes("clean") || t.includes("tidy") || t.includes("toys")) return "clean";
  if (t.includes("story") || t.includes("book") || t.includes("read")) return "story";
  return "default";
}

export function resolveIllustrationKey(theme: PosterTheme, stepTitle: string): IllustrationKey {
  const library = THEME_ILLUSTRATIONS[theme] ?? THEME_ILLUSTRATIONS.DINOSAUR;
  const category = inferStepCategory(stepTitle);
  return library[category] ?? library.default;
}

/** Placeholder for future AI illustration generation */
export async function generateAiIllustration(_prompt: string): Promise<IllustrationKey | null> {
  return null;
}
