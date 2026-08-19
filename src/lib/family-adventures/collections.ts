import type { AdventureCollection } from "@/lib/family-adventures/types";

export const ADVENTURE_COLLECTIONS: AdventureCollection[] = [
  { id: "free-weekend", emoji: "💚", label: "Free This Weekend", description: "No ticket needed" },
  { id: "rainy-day", emoji: "🌧", label: "Rainy Day Ideas", description: "Indoor & cosy" },
  { id: "stem", emoji: "🔬", label: "STEM Adventures", description: "Curious minds" },
  { id: "nature", emoji: "🌳", label: "Nature Walks", description: "Fresh air fun" },
  { id: "animals", emoji: "🦁", label: "Animal Lovers", description: "Zoos & farms" },
  { id: "trains", emoji: "🚂", label: "Train Lovers", description: "All aboard!" },
  { id: "toddlers", emoji: "👶", label: "Toddlers", description: "Gentle outings" },
  { id: "creative", emoji: "🎨", label: "Creative Kids", description: "Make & explore" },
  { id: "hidden-gems", emoji: "✨", label: "Hidden Gems", description: "Local favourites" },
];

export function collectionTags(collectionId: string): string[] {
  switch (collectionId) {
    case "free-weekend":
      return ["free"];
    case "rainy-day":
      return ["indoor", "rainy"];
    case "stem":
      return ["science", "nature", "animals"];
    case "nature":
      return ["nature", "outdoor"];
    case "animals":
      return ["animals", "zoo"];
    case "trains":
      return ["trains", "vehicles"];
    case "toddlers":
      return ["indoor", "library"];
    case "creative":
      return ["creative", "pretend play"];
    case "hidden-gems":
      return ["community", "free"];
    default:
      return [];
  }
}

export function adventureMatchesCollection(
  collectionId: string,
  tags: string[],
  isFree: boolean,
  indoorOutdoor: string,
  ageMinMonths: number
): boolean {
  switch (collectionId) {
    case "free-weekend":
      return isFree;
    case "rainy-day":
      return indoorOutdoor === "indoor" || tags.includes("rainy");
    case "toddlers":
      return ageMinMonths <= 24;
    case "animals":
      return tags.some((t) => ["animals", "zoo", "nature"].includes(t));
    case "trains":
      return tags.includes("trains");
    case "nature":
      return tags.includes("nature") || tags.includes("outdoor");
    case "creative":
      return tags.includes("creative");
    case "stem":
      return tags.some((t) => ["science", "nature", "animals"].includes(t));
    case "hidden-gems":
      return tags.includes("community") || tags.includes("free");
    default:
      return false;
  }
}
