import type { ToyCategory } from "@prisma/client";
import type { ToyIdentificationResult, ToyPlayActivity } from "@/types/toy-brain";

const VALID_CATEGORIES = new Set<string>([
  "LEGO", "DUPLO", "MAGNETIC_TILES", "BUILDING_BLOCKS", "PLAY_DOH", "TOY_CARS",
  "TRAIN_SETS", "ANIMAL_FIGURES", "KITCHEN_SETS", "PUZZLE", "BOOKS", "MUSICAL_TOYS",
  "BALLS", "ART_SUPPLIES", "DOLLS", "PRETEND_PLAY", "UNKNOWN",
]);

export function parseToyIdentification(raw: string): ToyIdentificationResult {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const slice = start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(slice);
  } catch {
    throw new Error("Toy identification returned invalid JSON.");
  }

  const obj = parsed as Record<string, unknown>;
  const name = typeof obj.name === "string" ? obj.name.trim() : "Toy";
  const categoryRaw = typeof obj.category === "string" ? obj.category.trim().toUpperCase() : "UNKNOWN";
  const category = (VALID_CATEGORIES.has(categoryRaw) ? categoryRaw : "UNKNOWN") as ToyCategory;
  const confidence =
    typeof obj.confidence === "number" ? Math.min(1, Math.max(0, obj.confidence)) : 0.7;
  const recommendedAge =
    typeof obj.recommendedAge === "string" ? obj.recommendedAge.trim() : "2-6 years";
  const description =
    typeof obj.description === "string" ? obj.description.trim() : "A fun toy for creative play.";

  return { name, category, confidence, recommendedAge, description };
}

export function parseToyActivities(raw: string, toyName: string): ToyPlayActivity[] {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const slice = start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(slice);
  } catch {
    throw new Error("Play idea generation returned invalid JSON.");
  }

  const obj = parsed as Record<string, unknown>;
  const activitiesRaw = Array.isArray(obj.activities) ? obj.activities : [];

  return activitiesRaw
    .map((item, i) => {
      const a = item as Record<string, unknown>;
      const title = typeof a.title === "string" ? a.title.trim() : `Play idea ${i + 1}`;
      return {
        id: `ai-${i}-${Date.now()}`,
        title,
        durationMinutes: typeof a.durationMinutes === "number" ? a.durationMinutes : 15,
        difficulty: (a.difficulty === "medium" || a.difficulty === "hard" ? a.difficulty : "easy") as ToyPlayActivity["difficulty"],
        indoorOutdoor: (["indoor", "outdoor", "either"].includes(String(a.indoorOutdoor))
          ? a.indoorOutdoor
          : "indoor") as ToyPlayActivity["indoorOutdoor"],
        messLevel: (["mess_free", "low", "medium", "high"].includes(String(a.messLevel))
          ? a.messLevel
          : "low") as ToyPlayActivity["messLevel"],
        prepMinutes: typeof a.prepMinutes === "number" ? a.prepMinutes : 2,
        materials: Array.isArray(a.materials) ? a.materials.map(String) : [toyName],
        instructions: Array.isArray(a.instructions) ? a.instructions.map(String) : [],
        parentTips: Array.isArray(a.parentTips) ? a.parentTips.map(String) : [],
        questionsToAsk: Array.isArray(a.questionsToAsk) ? a.questionsToAsk.map(String) : [],
        skills: Array.isArray(a.skills) ? a.skills.map(String) : ["creativity"],
        learningOutcomes: Array.isArray(a.learningOutcomes) ? a.learningOutcomes.map(String) : [],
        cleanupTips: Array.isArray(a.cleanupTips) ? a.cleanupTips.map(String) : [],
        safetyNotes: Array.isArray(a.safetyNotes) ? a.safetyNotes.map(String) : [],
        heroEmoji: typeof a.heroEmoji === "string" ? a.heroEmoji : "🎯",
        filters: Array.isArray(a.filters) ? a.filters.map(String) : ["quick_setup"],
      };
    })
    .filter((a) => a.title.length > 0 && a.instructions.length > 0);
}

export function toyIdentifySystemPrompt(): string {
  return `You are Parenfy's AI Toy Brain vision expert. Identify toys in photos for parents of children aged 2-6.

Return ONLY valid JSON:
{
  "name": "Specific toy name e.g. LEGO DUPLO Number Train",
  "category": "One of: LEGO, DUPLO, MAGNETIC_TILES, BUILDING_BLOCKS, PLAY_DOH, TOY_CARS, TRAIN_SETS, ANIMAL_FIGURES, KITCHEN_SETS, PUZZLE, BOOKS, MUSICAL_TOYS, BALLS, ART_SUPPLIES, DOLLS, PRETEND_PLAY, UNKNOWN",
  "confidence": 0.0-1.0,
  "recommendedAge": "e.g. 2-5 years",
  "description": "One sentence child-friendly description"
}

If multiple toys visible, identify the most prominent one. If unclear, use UNKNOWN with lower confidence.`;
}

export function toyPlayIdeasSystemPrompt(): string {
  return `You are Parenfy's AI Play Coach. Generate personalised, age-appropriate play activities using a toy the family already owns.

Return ONLY valid JSON:
{
  "activities": [
    {
      "title": "Catchy activity name",
      "durationMinutes": 15,
      "difficulty": "easy|medium|hard",
      "indoorOutdoor": "indoor|outdoor|either",
      "messLevel": "mess_free|low|medium|high",
      "prepMinutes": 2,
      "materials": ["Toy name", "..."],
      "instructions": ["Step 1...", "Step 2..."],
      "parentTips": ["Coaching tip..."],
      "questionsToAsk": ["Open question for child..."],
      "skills": ["creativity", "fine_motor", "language"],
      "learningOutcomes": ["What child learns — plain language for parents"],
      "cleanupTips": ["Quick cleanup tip"],
      "safetyNotes": ["Age-appropriate safety note if needed"],
      "heroEmoji": "🚒",
      "filters": ["quick_setup", "indoor", "stem"]
    }
  ]
}

Rules:
- Use ONLY materials the family likely has (toy + household items)
- Personalise to child age, interests, and parent goals
- Mix durations: some 5-10 min, some 20-30 min
- Explain WHY each activity helps development
- Never generic — tie missions to the specific toy
- filters use: 5min, 10min, 20min, 30min, 45min, indoor, outdoor, mess_free, rainy_day, quick_setup, montessori, stem, language`;
}
