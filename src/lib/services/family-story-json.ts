import "server-only";

interface StoryPayload {
  title: string;
  story: string;
  moral?: string;
}

const STORY_JSON_SCHEMA = `Respond with JSON only, no markdown:
{"title":"string","story":"string","moral":"string"}`;

export function storyGenerationSystemPrompt(base: string): string {
  return `${base}\n\n${STORY_JSON_SCHEMA}`;
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fenced) return fenced[1]!.trim();
  const inline = trimmed.match(/\{[\s\S]*\}/);
  return inline ? inline[0]! : trimmed;
}

export function parseStoryPayload(content: string): StoryPayload {
  const raw = stripJsonFence(content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Story generation failed — the AI returned an invalid format. Please try again.");
  }

  const payload = parsed as StoryPayload;
  if (!payload.title?.trim() || !payload.story?.trim()) {
    throw new Error("Story generation failed — missing title or story text. Please try again.");
  }

  return {
    title: payload.title.trim(),
    story: payload.story.trim(),
    moral: payload.moral?.trim(),
  };
}
