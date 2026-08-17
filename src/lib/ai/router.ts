import type { AIFeature } from "@prisma/client";
import type { AIModelTier } from "@/lib/ai/types";

const FAST_MODEL = process.env.OPENAI_MODEL_FAST?.trim() || process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
const LARGE_MODEL = process.env.OPENAI_MODEL_LARGE?.trim() || "gpt-4o";

/** Route tasks to fast vs large models — swap providers via env without code changes */
export function resolveModelForFeature(feature: AIFeature): { model: string; tier: AIModelTier } {
  switch (feature) {
    case "WEEKLY_PLAN":
    case "REFLECTION":
    case "COACHING":
      return { model: LARGE_MODEL, tier: "large" };
    case "TODAY_PLAN":
    case "CHAT":
    case "PERSONALIZE":
    case "FAMILY_STORY":
    case "VOICE_NARRATION":
    case "ROUTINE_GENERATION":
    case "POSTER_GENERATION":
    case "ADVENTURE_GENERATION":
    case "TOY_BRAIN_IDENTIFY":
    case "TOY_BRAIN_PLAY_IDEAS":
    default:
      return { model: FAST_MODEL, tier: "fast" };
  }
}
