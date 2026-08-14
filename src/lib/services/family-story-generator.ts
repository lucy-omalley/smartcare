import "server-only";

import { createHash } from "crypto";
import type { BedtimeMood, StoryCategory } from "@prisma/client";
import { completeAI } from "@/lib/ai/provider";
import { logAIRequest } from "@/lib/ai/usage";
import { prisma } from "@/lib/db";
import { recordFamilyStoryGenerated } from "@/lib/storytime/gating";
import { ensureWeeklyStoryCollection } from "@/lib/services/weekly-story-collection";

const STORY_SYSTEM = `You write original bedtime stories for young children. Each story must feel unique — never reuse the same plot structure twice in a row.

Structure every story with these sections (use natural prose, not headings):
1. A gentle beginning that sets the scene
2. A small adventure or discovery
3. A learning moment tied to the moral/theme
4. A positive, reassuring ending
5. A warm goodnight message addressing the child by name

Rules:
- Age-appropriate, warm, and calming for bedtime
- Weave in the child's favourites naturally (never forced lists)
- Avoid scary content, violence, or harsh language
- Use varied sentence lengths and vocabulary
- Return JSON only`;

export interface GenerateFamilyStoryInput {
  userId: string;
  childName: string;
  childAge?: string | null;
  category: StoryCategory;
  lengthMinutes: number;
  bedtimeMood?: BedtimeMood | null;
  moralTheme?: string | null;
  learningGoal?: string | null;
  favouriteAnimal?: string | null;
  favouriteVehicle?: string | null;
  favouriteCharacter?: string | null;
  interests?: string[];
}

interface StoryPayload {
  title: string;
  story: string;
  moral?: string;
}

export async function generateFamilyStory(input: GenerateFamilyStoryInput) {
  const wordTarget = input.lengthMinutes * 130;

  const userPrompt = JSON.stringify({
    childName: input.childName,
    childAge: input.childAge ?? "preschool",
    category: input.category,
    targetWords: wordTarget,
    bedtimeMood: input.bedtimeMood ?? "CALM",
    moralTheme: input.moralTheme ?? "kindness",
    learningGoal: input.learningGoal,
    favourites: {
      animal: input.favouriteAnimal,
      vehicle: input.favouriteVehicle,
      character: input.favouriteCharacter,
    },
    interests: input.interests ?? [],
    seed: createHash("sha256")
      .update(`${input.userId}:${Date.now()}:${Math.random()}`)
      .digest("hex")
      .slice(0, 12),
  });

  const result = await completeAI({
    feature: "FAMILY_STORY",
    systemPrompt: STORY_SYSTEM,
    userPrompt,
    maxTokens: Math.min(2800, 180 + wordTarget * 2),
    temperature: 0.88,
    jsonMode: true,
    userId: input.userId,
  });

  await logAIRequest({ userId: input.userId, feature: "FAMILY_STORY", resolution: "LLM" });

  const parsed = JSON.parse(result.content) as StoryPayload;
  if (!parsed.title?.trim() || !parsed.story?.trim()) {
    throw new Error("Story generation failed — please try again.");
  }

  const story = await prisma.familyStory.create({
    data: {
      userId: input.userId,
      title: parsed.title.trim(),
      story: parsed.story.trim(),
      category: input.category,
      lengthMinutes: input.lengthMinutes,
      bedtimeMood: input.bedtimeMood ?? undefined,
      moralTheme: input.moralTheme?.trim() || parsed.moral?.trim() || null,
      learningGoal: input.learningGoal?.trim() || null,
      childName: input.childName,
      childAge: input.childAge ?? null,
    },
  });

  await recordFamilyStoryGenerated(input.userId);
  await ensureWeeklyStoryCollection(input.userId, story.id);

  return story;
}
