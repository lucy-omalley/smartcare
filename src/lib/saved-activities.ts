import type { DailyBriefPlay } from "@/types/daily-brief";

const LEGACY_PREFIX = "Activity: ";

export function isLegacySavedActivityMemory(content: string): boolean {
  return content.trimStart().startsWith(LEGACY_PREFIX);
}

export function parseLegacySavedActivityMemory(content: string): {
  title: string;
  instructions: string;
} {
  const trimmed = content.trim();
  if (!trimmed.startsWith(LEGACY_PREFIX)) {
    return { title: "Saved activity", instructions: trimmed };
  }
  const body = trimmed.slice(LEGACY_PREFIX.length);
  const newline = body.indexOf("\n");
  if (newline === -1) {
    return { title: body.trim() || "Saved activity", instructions: "" };
  }
  return {
    title: body.slice(0, newline).trim() || "Saved activity",
    instructions: body.slice(newline + 1).trim(),
  };
}

export function legacyMemoryToPlay(content: string): DailyBriefPlay {
  const { title, instructions } = parseLegacySavedActivityMemory(content);
  return {
    title,
    materials: [],
    instructions: instructions ? [instructions] : [],
    skillsDeveloped: [],
    durationMinutes: 0,
    indoorOutdoor: "either",
  };
}
