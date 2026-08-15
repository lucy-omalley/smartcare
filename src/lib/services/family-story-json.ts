import "server-only";

import type { BedtimeMood, StoryCategory } from "@prisma/client";
import type { GenerateFamilyStoryInput } from "@/lib/services/family-story-generator";

interface StoryPayload {
  title: string;
  story: string;
  moral?: string;
}

const STORY_JSON_SCHEMA = `Respond with JSON only, no markdown fences:
{"title":"Short story title","story":"Full story text with paragraphs","moral":"One-line lesson"}`;

export function storyGenerationSystemPrompt(base: string): string {
  return `${base}\n\n${STORY_JSON_SCHEMA}`;
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1]!.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function readString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

function normalizeStoryRecord(raw: unknown): StoryPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;

  const title = readString(record.title ?? record.name ?? record.storyTitle);
  const story = readString(
    record.story ??
      record.content ??
      record.body ??
      record.text ??
      record.storyText ??
      record.narrative
  );
  const moral = readString(record.moral ?? record.theme ?? record.lesson) || undefined;

  if (!title || !story) return null;
  return { title, story, moral };
}

/** Last-resort extraction when JSON.parse fails on truncated model output. */
function extractStoryFieldsHeuristic(raw: string): StoryPayload | null {
  const titleMatch = raw.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  const storyMatch = raw.match(/"story"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/s);
  if (!titleMatch || !storyMatch) return null;

  const unescape = (s: string) =>
    s.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();

  const title = unescape(titleMatch[1]!);
  const story = unescape(storyMatch[1]!);
  if (!title || story.length < 80) return null;

  const moralMatch = raw.match(/"moral"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  return {
    title,
    story,
    moral: moralMatch ? unescape(moralMatch[1]!) : undefined,
  };
}

export function parseStoryPayload(content: string): StoryPayload {
  if (!content?.trim()) {
    throw new Error("Story generation returned empty content.");
  }

  const raw = stripJsonFence(content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const heuristic = extractStoryFieldsHeuristic(raw);
    if (heuristic) return heuristic;
    throw new Error("Story generation failed — the AI returned an invalid format. Please try again.");
  }

  const payload = normalizeStoryRecord(parsed);
  if (payload) return payload;

  throw new Error("Story generation failed — missing title or story text. Please try again.");
}

const CATEGORY_OPENINGS: Partial<Record<StoryCategory, string>> = {
  ADVENTURE: "At the edge of a sleepy town",
  FRIENDSHIP: "In a sunny playground",
  KINDNESS: "On a quiet morning",
  ANIMALS: "In a meadow where the grass whispered",
  DINOSAURS: "Long ago, in a valley of gentle dinosaurs",
  SPACE: "Past the moon and twinkling stars",
  FAMILY: "At home, where love lived in every corner",
};

export function buildFallbackFamilyStory(input: GenerateFamilyStoryInput): StoryPayload {
  const child = input.childName.trim() || "little one";
  const moral = input.moralTheme?.trim() || "kindness";
  const learning = input.learningGoal?.trim() || moral;
  const fav =
    input.favouriteAnimal?.trim() ||
    input.favouriteCharacter?.trim() ||
    input.favouriteVehicle?.trim() ||
    "friendly companion";
  const opening = CATEGORY_OPENINGS[input.category] ?? "Once upon a soft evening";
  const mood =
    input.bedtimeMood === "PLAYFUL"
      ? "giggles and gentle wonder"
      : input.bedtimeMood === "ADVENTUROUS"
        ? "quiet courage"
        : "calm and cosy warmth";

  const story = `${opening}, ${child} noticed something special — ${fav} seemed to glow with ${mood}.

Together they set off on a small adventure. They helped a friend who felt shy, shared a snack, and listened when someone needed comfort. ${child} learned that ${learning} makes the world feel safer and brighter.

When the stars appeared, ${child} snuggled under a blanket, heart full and eyes heavy. "Goodnight, ${child}," whispered the night. "You were brave, gentle, and kind today. Dream sweet dreams until the morning light."`;

  return {
    title: `${child} and the ${moral} star`,
    story,
    moral,
  };
}
