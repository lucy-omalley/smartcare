import type { GeneratedPosterPayload, PosterStepPayload } from "@/types/routine-poster";

export function parsePosterPayload(raw: string): GeneratedPosterPayload {
  const trimmed = raw.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  const slice = jsonStart >= 0 && jsonEnd > jsonStart ? trimmed.slice(jsonStart, jsonEnd + 1) : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(slice);
  } catch {
    throw new Error("Poster generation returned invalid JSON.");
  }

  const obj = parsed as Record<string, unknown>;
  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  const celebrationText =
    typeof obj.celebrationText === "string" ? obj.celebrationText.trim() : "Fantastic job!";
  const stepsRaw = Array.isArray(obj.steps) ? obj.steps : [];

  const steps: PosterStepPayload[] = stepsRaw
    .map((s, i) => {
      const step = s as Record<string, unknown>;
      const stepTitle = typeof step.title === "string" ? step.title.trim() : `Step ${i + 1}`;
      return {
        title: stepTitle,
        iconEmoji: typeof step.iconEmoji === "string" ? step.iconEmoji : "⭐",
        illustrationKey: typeof step.illustrationKey === "string" ? step.illustrationKey : undefined,
        isStoryTimeStep: Boolean(step.isStoryTimeStep),
        isSongStep: Boolean(step.isSongStep),
      };
    })
    .filter((s) => s.title.length > 0);

  if (!title || steps.length === 0) {
    throw new Error("Poster generation missing title or steps.");
  }

  return { title, celebrationText, steps };
}

export function posterGenerationSystemPrompt(extra: string): string {
  return `You are Parenfy's AI Family Routine Designer. Create printable visual routine posters for children aged 2–6.

${extra}

Return ONLY valid JSON:
{
  "title": "short fun poster title with theme",
  "celebrationText": "encouraging celebration at the end",
  "steps": [
    {
      "title": "2-4 words max — child reads by icon",
      "iconEmoji": "single large clear emoji",
      "isStoryTimeStep": false,
      "isSongStep": false
    }
  ]
}

Rules:
- Minimal words — child should understand by looking at icons
- Use the child's name in title if natural
- Match the visual theme throughout (dinosaurs, space, etc.)
- End with a celebration step feel in celebrationText
- For bedtime, set isStoryTimeStep on story step
- For clean-up routines, set isSongStep on song step if included
- Large clear emojis only — no scary content`;
}
