import "server-only";

import { completeAI } from "@/lib/ai/provider";
import type { VisualRoutine } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertCanCreateRoutine, assertCanUseAiRoutine } from "@/lib/routines/gating";
import { buildTemplateRoutine } from "@/lib/routines/templates";
import { parseRoutinePayload, routineGenerationSystemPrompt } from "@/lib/routines/routine-json";
import { stepCountForLength } from "@/lib/routines/constants";
import type { GenerateRoutineInput, VisualRoutineView } from "@/types/visual-routine";

const SYSTEM = routineGenerationSystemPrompt(
  `Transform routine steps into playful themed versions. Examples:
- "Brush Teeth" → "🦕 Dino Brush Time!" or "🚒 Fire Engine Tooth Patrol!"
- Use favourite interests as themes throughout`
);

function toView(routine: VisualRoutine & { steps: Array<{
  id: string;
  orderIndex: number;
  title: string;
  instruction: string;
  iconEmoji: string;
  illustrationKey: string | null;
  durationMinutes: number;
  rewardEmoji: string;
  voiceInstruction: string | null;
  isStoryTimeStep: boolean;
}> }): VisualRoutineView {
  return {
    id: routine.id,
    title: routine.title,
    templateType: routine.templateType,
    childName: routine.childName,
    childAge: routine.childAge,
    interests: routine.interests,
    challenge: routine.challenge,
    length: routine.length,
    rewardsEnabled: routine.rewardsEnabled,
    isAiGenerated: routine.isAiGenerated,
    isFavorite: routine.isFavorite,
    createdAt: routine.createdAt.toISOString(),
    updatedAt: routine.updatedAt.toISOString(),
    steps: routine.steps
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => ({
        id: s.id,
        orderIndex: s.orderIndex,
        title: s.title,
        instruction: s.instruction,
        iconEmoji: s.iconEmoji,
        illustrationKey: s.illustrationKey,
        durationMinutes: s.durationMinutes,
        rewardEmoji: s.rewardEmoji,
        voiceInstruction: s.voiceInstruction,
        isStoryTimeStep: s.isStoryTimeStep,
      })),
  };
}

async function persistRoutine(
  input: GenerateRoutineInput,
  payload: { title: string; steps: Array<{
    title: string;
    instruction: string;
    iconEmoji: string;
    durationMinutes: number;
    rewardEmoji?: string;
    voiceInstruction?: string;
    isStoryTimeStep?: boolean;
  }> },
  isAiGenerated: boolean
): Promise<VisualRoutineView> {
  const routine = await prisma.visualRoutine.create({
    data: {
      userId: input.userId,
      title: payload.title.slice(0, 120),
      templateType: input.templateType,
      childName: input.childName,
      childAge: input.childAge,
      interests: input.interests,
      challenge: input.challenge,
      length: input.length,
      rewardsEnabled: input.rewardsEnabled ?? true,
      isAiGenerated,
      steps: {
        create: payload.steps.map((s, i) => ({
          orderIndex: i,
          title: s.title.slice(0, 80),
          instruction: s.instruction.slice(0, 300),
          iconEmoji: s.iconEmoji.slice(0, 8) || "⭐",
          durationMinutes: s.durationMinutes,
          rewardEmoji: (s.rewardEmoji ?? "⭐").slice(0, 8),
          voiceInstruction: (s.voiceInstruction ?? s.instruction).slice(0, 300),
          isStoryTimeStep: Boolean(s.isStoryTimeStep),
        })),
      },
    },
    include: { steps: true },
  });

  return toView(routine);
}

export async function generateVisualRoutine(input: GenerateRoutineInput): Promise<VisualRoutineView> {
  await assertCanCreateRoutine(input.userId);
  await assertCanUseAiRoutine(input.userId);

  const stepTarget = stepCountForLength(input.length);
  const fallback = buildTemplateRoutine({
    templateType: input.templateType,
    childName: input.childName,
    length: input.length,
    primaryInterest: input.interests[0],
  });

  try {
    const userPrompt = JSON.stringify({
      templateType: input.templateType,
      childName: input.childName,
      childAge: input.childAge ?? "preschool",
      interests: input.interests,
      challenge: input.challenge,
      targetSteps: stepTarget,
    });

    const result = await completeAI({
      feature: "ROUTINE_GENERATION",
      systemPrompt: SYSTEM,
      userPrompt,
      maxTokens: 1800,
      temperature: 0.85,
      jsonMode: true,
      userId: input.userId,
    });

    if (!result.content?.trim()) throw new Error("Empty AI response");
    const payload = parseRoutinePayload(result.content);
    return persistRoutine(input, payload, true);
  } catch {
    return persistRoutine(input, fallback, false);
  }
}

export async function createRoutineFromTemplate(input: GenerateRoutineInput): Promise<VisualRoutineView> {
  await assertCanCreateRoutine(input.userId);
  const payload = buildTemplateRoutine({
    templateType: input.templateType,
    childName: input.childName,
    length: input.length,
    primaryInterest: input.interests[0],
  });
  return persistRoutine(input, payload, false);
}

export async function listVisualRoutines(userId: string): Promise<VisualRoutineView[]> {
  const routines = await prisma.visualRoutine.findMany({
    where: { userId, deletedAt: null },
    include: { steps: { orderBy: { orderIndex: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  return routines.map(toView);
}

export async function getVisualRoutine(userId: string, routineId: string): Promise<VisualRoutineView | null> {
  const routine = await prisma.visualRoutine.findFirst({
    where: { id: routineId, userId, deletedAt: null },
    include: {
      steps: { orderBy: { orderIndex: "asc" } },
      schedules: true,
    },
  });
  if (!routine) return null;
  return {
    ...toView(routine),
    schedules: routine.schedules.map((s) => ({
      id: s.id,
      routineId: s.routineId,
      timeOfDay: s.timeOfDay,
      dayType: s.dayType,
      reminderTime: s.reminderTime,
      enabled: s.enabled,
    })),
  };
}

export async function deleteVisualRoutine(userId: string, routineId: string): Promise<void> {
  await prisma.visualRoutine.updateMany({
    where: { id: routineId, userId },
    data: { deletedAt: new Date() },
  });
}

export async function toggleRoutineFavorite(userId: string, routineId: string, isFavorite: boolean): Promise<VisualRoutineView | null> {
  await prisma.visualRoutine.updateMany({
    where: { id: routineId, userId, deletedAt: null },
    data: { isFavorite },
  });
  return getVisualRoutine(userId, routineId);
}
