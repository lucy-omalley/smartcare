import type { GeneratedRoutinePayload, RoutineStepPayload } from "@/types/visual-routine";

export function parseRoutinePayload(raw: string): GeneratedRoutinePayload {
  const trimmed = raw.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  const slice = jsonStart >= 0 && jsonEnd > jsonStart ? trimmed.slice(jsonStart, jsonEnd + 1) : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(slice);
  } catch {
    throw new Error("Routine generation returned invalid JSON.");
  }

  const obj = parsed as Record<string, unknown>;
  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  const stepsRaw = Array.isArray(obj.steps) ? obj.steps : [];

  const steps: RoutineStepPayload[] = stepsRaw
    .map((s, i) => {
      const step = s as Record<string, unknown>;
      const stepTitle = typeof step.title === "string" ? step.title.trim() : `Step ${i + 1}`;
      const instruction = typeof step.instruction === "string" ? step.instruction.trim() : "Let's do this!";
      return {
        title: stepTitle,
        instruction,
        iconEmoji: typeof step.iconEmoji === "string" ? step.iconEmoji : "⭐",
        durationMinutes: typeof step.durationMinutes === "number" ? Math.min(15, Math.max(1, step.durationMinutes)) : 2,
        rewardEmoji: typeof step.rewardEmoji === "string" ? step.rewardEmoji : "⭐",
        voiceInstruction: typeof step.voiceInstruction === "string" ? step.voiceInstruction : instruction,
        isStoryTimeStep: Boolean(step.isStoryTimeStep),
      };
    })
    .filter((s) => s.title.length > 0);

  if (!title || steps.length === 0) {
    throw new Error("Routine generation missing title or steps.");
  }

  return { title, steps };
}

export function routineGenerationSystemPrompt(extra: string): string {
  return `You are Parenfy's Visual Routine Studio AI. Create fun, visual routines for children aged 2–6.

${extra}

Return ONLY valid JSON:
{
  "title": "string",
  "steps": [
    {
      "title": "short fun title with emoji theme",
      "instruction": "1-2 simple sentences the child can follow",
      "iconEmoji": "single emoji",
      "durationMinutes": number,
      "rewardEmoji": "⭐",
      "voiceInstruction": "what to read aloud warmly",
      "isStoryTimeStep": false
    }
  ]
}

Rules:
- Use the child's name naturally
- Personalise with their interests (vehicles, dinosaurs, etc.)
- Minimal text — child-friendly language
- Each step needs a large clear emoji icon
- For bedtime routines, set isStoryTimeStep true on the final story step if included
- No scary content`;
}
