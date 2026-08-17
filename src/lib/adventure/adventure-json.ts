import type { GeneratedAdventurePayload, AdventurePagePayload } from "@/types/adventure-journey";

export function parseAdventurePayload(raw: string): GeneratedAdventurePayload {
  const trimmed = raw.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  const slice = jsonStart >= 0 && jsonEnd > jsonStart ? trimmed.slice(jsonStart, jsonEnd + 1) : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(slice);
  } catch {
    throw new Error("Adventure generation returned invalid JSON.");
  }

  const obj = parsed as Record<string, unknown>;
  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  const characterName = typeof obj.characterName === "string" ? obj.characterName.trim() : "";
  const storyIntro = typeof obj.storyIntro === "string" ? obj.storyIntro.trim() : "";
  const storyEnding = typeof obj.storyEnding === "string" ? obj.storyEnding.trim() : "";
  const celebrationText =
    typeof obj.celebrationText === "string" ? obj.celebrationText.trim() : "Adventure complete!";
  const routineGoal = typeof obj.routineGoal === "string" ? obj.routineGoal.trim() : "";

  const pagesRaw = Array.isArray(obj.pages) ? obj.pages : Array.isArray(obj.steps) ? obj.steps : [];

  const pages: AdventurePagePayload[] = pagesRaw
    .map((s, i) => {
      const page = s as Record<string, unknown>;
      const missionLabel =
        typeof page.missionLabel === "string"
          ? page.missionLabel.trim()
          : typeof page.title === "string"
            ? page.title.trim()
            : `Mission ${i + 1}`;
      const storyText =
        typeof page.storyText === "string"
          ? page.storyText.trim()
          : typeof page.instruction === "string"
            ? page.instruction.trim()
            : "";
      return {
        storyText,
        missionLabel,
        title: missionLabel,
        iconEmoji: typeof page.iconEmoji === "string" ? page.iconEmoji : "⭐",
        rewardStars: typeof page.rewardStars === "number" ? page.rewardStars : 1,
        isStoryTimeStep: Boolean(page.isStoryTimeStep),
        isSongStep: Boolean(page.isSongStep),
      };
    })
    .filter((p) => p.missionLabel.length > 0);

  if (!title || pages.length === 0) {
    throw new Error("Adventure generation missing title or pages.");
  }

  return {
    title,
    characterName,
    storyIntro,
    storyEnding,
    celebrationText,
    routineGoal,
    pages,
  };
}

export function adventureGenerationSystemPrompt(extra: string): string {
  return `You are Parenfy's AI Adventure Journey creator. Transform daily routines into personalised story adventures for children aged 2–6.

${extra}

Return ONLY valid JSON:
{
  "title": "e.g. Jack's Dinosaur Bedtime Adventure",
  "characterName": "e.g. Captain Dino",
  "storyIntro": "2-3 exciting sentences setting the scene",
  "storyEnding": "Congratulations message — hero ready for tomorrow",
  "celebrationText": "Short cheer e.g. Roarsome adventure complete!",
  "routineGoal": "One sentence parent-facing goal",
  "pages": [
    {
      "storyText": "Story problem/setup in child-friendly language (Oh no! Captain Dino...)",
      "missionLabel": "Brush Teeth",
      "iconEmoji": "🪥",
      "rewardStars": 1,
      "isStoryTimeStep": false,
      "isSongStep": false
    }
  ]
}

Rules:
- Child is the hero; create a fun character name matching the theme
- Each page = mini story moment + clear mission (NOT a boring checklist)
- Minimal words on missions — child understands from emoji + story
- Bedtime: last story page has isStoryTimeStep true
- Clean-up: song page has isSongStep true
- rewardStars: 1-3 per page based on difficulty
- Personalise with child name, age, interests, challenge and parent goals
- Never generic — every adventure feels unique`;
}
