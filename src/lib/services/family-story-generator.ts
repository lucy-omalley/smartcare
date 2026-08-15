import "server-only";

import { createHash } from "crypto";
import type { BedtimeMood, StoryCategory } from "@prisma/client";
import { completeAI } from "@/lib/ai/provider";
import { logAIRequest } from "@/lib/ai/usage";
import { prisma } from "@/lib/db";
import { recordFamilyStoryGenerated } from "@/lib/storytime/gating";
import { ensureWeeklyStoryCollection } from "@/lib/services/weekly-story-collection";
import {
  buildFallbackFamilyStory,
  parseStoryPayload,
  storyGenerationSystemPrompt,
} from "@/lib/services/family-story-json";
import { AiDisabledError, EmailNotVerifiedError } from "@/lib/ai/guards";

const STORY_SYSTEM = storyGenerationSystemPrompt(`You write original bedtime stories for young children. Each story must feel unique.

Structure (natural prose, no headings):
1. Gentle beginning
2. Small adventure
3. Learning moment tied to the moral
4. Positive ending
5. Goodnight message using the child's name

Rules:
- Age-appropriate, warm, calming
- Weave favourites in naturally
- No scary content
- Keep the story within the target word count — do not exceed it
- The "story" field must be plain text (use \\n for paragraph breaks, escape quotes)`);

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

function storyMaxTokens(wordTarget: number): number {
  // ~1.3 tokens per word + JSON overhead; cap to avoid truncated JSON on long stories.
  return Math.min(3500, Math.max(900, Math.round(wordTarget * 1.6) + 120));
}

async function requestStoryJson(
  input: GenerateFamilyStoryInput,
  wordTarget: number,
  attempt: number
): Promise<StoryPayload> {
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
      .update(`${input.userId}:${Date.now()}:${attempt}:${Math.random()}`)
      .digest("hex")
      .slice(0, 12),
  });

  const result = await completeAI({
    feature: "FAMILY_STORY",
    systemPrompt: STORY_SYSTEM,
    userPrompt,
    maxTokens: storyMaxTokens(wordTarget),
    temperature: attempt === 0 ? 0.85 : 0.65,
    jsonMode: true,
    userId: input.userId,
  });

  if (!result.content?.trim()) {
    throw new Error("Story generation returned empty content.");
  }

  return parseStoryPayload(result.content);
}

async function generateStoryPayload(
  input: GenerateFamilyStoryInput,
  wordTarget: number
): Promise<{ payload: StoryPayload; usedFallback: boolean }> {
  const attempts = 2;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const payload = await requestStoryJson(input, wordTarget, attempt);
      return { payload, usedFallback: false };
    } catch (error) {
      lastError = error;
      if (error instanceof AiDisabledError || error instanceof EmailNotVerifiedError) {
        throw error;
      }
    }
  }

  console.warn("Family story AI failed, using personalized fallback:", lastError);
  return { payload: buildFallbackFamilyStory(input), usedFallback: true };
}

export async function generateFamilyStory(input: GenerateFamilyStoryInput) {
  const wordTarget = input.lengthMinutes * 130;
  const { payload, usedFallback } = await generateStoryPayload(input, wordTarget);

  if (!usedFallback) {
    await logAIRequest({ userId: input.userId, feature: "FAMILY_STORY", resolution: "LLM" });
  } else {
    await logAIRequest({ userId: input.userId, feature: "FAMILY_STORY", resolution: "DB_ONLY" });
  }

  const story = await prisma.familyStory.create({
    data: {
      userId: input.userId,
      title: payload.title.trim(),
      story: payload.story.trim(),
      category: input.category,
      lengthMinutes: input.lengthMinutes,
      bedtimeMood: input.bedtimeMood ?? undefined,
      moralTheme: input.moralTheme?.trim() || payload.moral?.trim() || null,
      learningGoal: input.learningGoal?.trim() || null,
      childName: input.childName,
      childAge: input.childAge ?? null,
    },
  });

  await recordFamilyStoryGenerated(input.userId);
  await ensureWeeklyStoryCollection(input.userId, story.id);

  return story;
}
