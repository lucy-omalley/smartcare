import "server-only";

import { completeAI } from "@/lib/ai/provider";
import type { RoutinePoster } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  assertCanCreatePoster,
  assertCanUseAiPoster,
  assertLayoutAllowed,
  assertThemeAllowed,
  getPosterFeatures,
} from "@/lib/posters/gating";
import { resolveIllustrationKey } from "@/lib/posters/illustration-service";
import { parsePosterPayload, posterGenerationSystemPrompt } from "@/lib/posters/poster-json";
import { getThemeStyle } from "@/lib/posters/themes";
import { buildTemplateRoutine } from "@/lib/routines/templates";
import { stepCountForLength } from "@/lib/routines/constants";
import { categoryForTemplate } from "@/lib/posters/constants";
import type { GeneratedPosterPayload, LegacyGeneratePosterInput, RoutinePosterView } from "@/types/routine-poster";

type GeneratePosterInput = LegacyGeneratePosterInput;

const SYSTEM = posterGenerationSystemPrompt(
  `Design vertical flow-chart poster steps. Each step needs ONE large emoji and 2-4 word title.
Theme the entire poster (e.g. "🦕 Dino Brush" not just "Brush Teeth").
Add a fun celebration message matching the theme.`
);

function toView(
  poster: RoutinePoster & {
    steps: Array<{
      id: string;
      orderIndex: number;
      title: string;
      storyText: string | null;
      missionLabel: string | null;
      iconEmoji: string;
      illustrationKey: string | null;
      rewardStars: number;
      pageQrTarget: RoutinePoster["qrTarget"] | null;
      isStoryTimeStep: boolean;
      isSongStep: boolean;
    }>;
  }
): RoutinePosterView {
  const pageViews = poster.steps
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((s) => ({
      id: s.id,
      orderIndex: s.orderIndex,
      title: s.title,
      storyText: s.storyText,
      missionLabel: s.missionLabel ?? s.title,
      iconEmoji: s.iconEmoji,
      illustrationKey: s.illustrationKey,
      rewardStars: s.rewardStars ?? 1,
      pageQrTarget: s.pageQrTarget,
      isStoryTimeStep: s.isStoryTimeStep,
      isSongStep: s.isSongStep,
    }));
  const totalRewardStars = pageViews.reduce((sum, p) => sum + (p.rewardStars ?? 1), 0);
  return {
    id: poster.id,
    title: poster.title,
    routineGoal: poster.routineGoal,
    characterName: poster.characterName,
    storyIntro: poster.storyIntro,
    storyEnding: poster.storyEnding,
    storyTheme: poster.storyTheme,
    adventureFormat: poster.adventureFormat,
    totalRewardStars: poster.totalRewardStars || totalRewardStars,
    adventurePoints: poster.adventurePoints || totalRewardStars * 10,
    childName: poster.childName,
    childAge: poster.childAge,
    childGender: poster.childGender,
    numberOfChildren: poster.numberOfChildren,
    theme: poster.theme,
    favouriteColours: poster.favouriteColours,
    templateType: poster.templateType,
    challenge: poster.challenge,
    length: poster.length,
    parentGoals: poster.parentGoals,
    layout: poster.layout,
    category: poster.category,
    celebrationText: poster.celebrationText,
    rewardEnabled: poster.rewardEnabled,
    parentSignature: poster.parentSignature,
    stickerSpaceEnabled: poster.stickerSpaceEnabled,
    qrTarget: poster.qrTarget,
    linkedRoutineId: poster.linkedRoutineId,
    isAiGenerated: poster.isAiGenerated,
    printCount: poster.printCount,
    qrScanCount: poster.qrScanCount,
    createdAt: poster.createdAt.toISOString(),
    updatedAt: poster.updatedAt.toISOString(),
    pages: pageViews,
    steps: pageViews,
  };
}

function templateToPosterPayload(
  input: GeneratePosterInput,
  templateSteps: ReturnType<typeof buildTemplateRoutine>
): GeneratedPosterPayload {
  const themeStyle = getThemeStyle(input.theme);
  const goalLabel = input.parentGoals[0]?.replace(/_/g, " ").toLowerCase() ?? "independence";
  return {
    title: `${input.childName}'s ${themeStyle.label}`,
    routineGoal: `Help ${input.childName} build ${goalLabel} — one fun step at a time.`,
    celebrationText: themeStyle.celebration,
    steps: templateSteps.steps.map((s) => ({
      title: s.title.slice(0, 40),
      iconEmoji: s.iconEmoji,
      illustrationKey: resolveIllustrationKey(input.theme, s.title),
      isStoryTimeStep: s.isStoryTimeStep,
      isSongStep: s.title.toLowerCase().includes("song"),
    })),
  };
}

async function persistPoster(
  input: GeneratePosterInput,
  payload: GeneratedPosterPayload,
  isAiGenerated: boolean
): Promise<RoutinePosterView> {
  const features = await getPosterFeatures(input.userId);
  assertThemeAllowed(input.theme, features.isPremium);
  if (input.layout) assertLayoutAllowed(input.layout, features.isPremium);

  const poster = await prisma.routinePoster.create({
    data: {
      userId: input.userId,
      title: payload.title.slice(0, 120),
      routineGoal: (payload.routineGoal ?? "").slice(0, 200) || null,
      childName: input.childName,
      childAge: input.childAge,
      childGender: input.childGender,
      numberOfChildren: input.numberOfChildren ?? 1,
      theme: input.theme,
      favouriteColours: input.favouriteColours,
      templateType: input.templateType,
      challenge: input.challenge,
      length: input.length,
      parentGoals: input.parentGoals,
      layout: input.layout ?? "A4_PORTRAIT",
      category: input.category ?? categoryForTemplate(input.templateType),
      celebrationText: payload.celebrationText.slice(0, 80),
      rewardEnabled: input.rewardEnabled ?? true,
      parentSignature: input.parentSignature ?? null,
      stickerSpaceEnabled: input.stickerSpaceEnabled ?? true,
      qrTarget: input.qrTarget ?? "TODAY_PLAN",
      isAiGenerated,
      steps: {
        create: payload.steps.map((s, i) => ({
          orderIndex: i,
          title: s.title.slice(0, 60),
          iconEmoji: s.iconEmoji.slice(0, 8) || "⭐",
          illustrationKey: s.illustrationKey ?? resolveIllustrationKey(input.theme, s.title),
          isStoryTimeStep: Boolean(s.isStoryTimeStep),
          isSongStep: Boolean(s.isSongStep),
        })),
      },
    },
    include: { steps: true },
  });

  return toView(poster);
}
export async function generateRoutinePoster(input: GeneratePosterInput): Promise<RoutinePosterView> {
  await assertCanCreatePoster(input.userId);
  await assertCanUseAiPoster(input.userId);

  const fallbackTemplate = buildTemplateRoutine({
    templateType: input.templateType,
    childName: input.childName,
    length: input.length,
    primaryInterest: input.theme.toLowerCase(),
  });
  const fallback = templateToPosterPayload(input, fallbackTemplate);

  try {
    const themeStyle = getThemeStyle(input.theme);
    const userPrompt = JSON.stringify({
      templateType: input.templateType,
      childName: input.childName,
      childAge: input.childAge ?? "preschool",
      childGender: input.childGender,
      numberOfChildren: input.numberOfChildren ?? 1,
      theme: themeStyle.label,
      themeEmoji: themeStyle.emoji,
      favouriteColours: input.favouriteColours,
      challenge: input.challenge,
      parentGoals: input.parentGoals,
      targetSteps: stepCountForLength(input.length),
      celebrationStyle: themeStyle.celebration,
    });

    const result = await completeAI({
      feature: "POSTER_GENERATION",
      systemPrompt: SYSTEM,
      userPrompt,
      maxTokens: 1600,
      temperature: 0.85,
      jsonMode: true,
      userId: input.userId,
    });

    if (!result.content?.trim()) throw new Error("Empty AI response");
    const payload = parsePosterPayload(result.content);
    payload.steps = payload.steps.map((s) => ({
      ...s,
      illustrationKey: s.illustrationKey ?? resolveIllustrationKey(input.theme, s.title),
    }));
    return persistPoster(input, payload, true);
  } catch {
    return persistPoster(input, fallback, false);
  }
}

export async function createPosterFromTemplate(input: GeneratePosterInput): Promise<RoutinePosterView> {
  await assertCanCreatePoster(input.userId);
  const template = buildTemplateRoutine({
    templateType: input.templateType,
    childName: input.childName,
    length: input.length,
    primaryInterest: input.theme.toLowerCase(),
  });
  return persistPoster(input, templateToPosterPayload(input, template), false);
}

export async function listRoutinePosters(userId: string): Promise<RoutinePosterView[]> {
  const posters = await prisma.routinePoster.findMany({
    where: { userId, deletedAt: null },
    include: { steps: { orderBy: { orderIndex: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  return posters.map(toView);
}

export async function getRoutinePoster(userId: string, posterId: string): Promise<RoutinePosterView | null> {
  const poster = await prisma.routinePoster.findFirst({
    where: { id: posterId, userId, deletedAt: null },
    include: { steps: { orderBy: { orderIndex: "asc" } } },
  });
  if (!poster) return null;
  return toView(poster);
}

export async function updateRoutinePoster(
  userId: string,
  posterId: string,
  data: {
    title?: string;
    routineGoal?: string | null;
    theme?: RoutinePoster["theme"];
    favouriteColours?: string[];
    numberOfChildren?: number;
    layout?: RoutinePoster["layout"];
    category?: RoutinePoster["category"];
    celebrationText?: string;
    parentSignature?: string | null;
    rewardEnabled?: boolean;
    stickerSpaceEnabled?: boolean;
    qrTarget?: RoutinePoster["qrTarget"];
    steps?: Array<{
      id?: string;
      title: string;
      iconEmoji: string;
      isStoryTimeStep?: boolean;
      isSongStep?: boolean;
    }>;
  }
): Promise<RoutinePosterView | null> {
  const existing = await prisma.routinePoster.findFirst({
    where: { id: posterId, userId, deletedAt: null },
  });
  if (!existing) return null;

  if (data.layout) {
    const features = await getPosterFeatures(userId);
    assertLayoutAllowed(data.layout, features.isPremium);
  }

  if (data.theme) {
    const features = await getPosterFeatures(userId);
    assertThemeAllowed(data.theme, features.isPremium);
  }

  const themeForSteps = data.theme ?? existing.theme;

  if (data.steps) {
    await prisma.routinePosterStep.deleteMany({ where: { posterId } });
    await prisma.routinePosterStep.createMany({
      data: data.steps.map((s, i) => ({
        posterId,
        orderIndex: i,
        title: s.title.slice(0, 60),
        iconEmoji: s.iconEmoji.slice(0, 8) || "⭐",
        illustrationKey: resolveIllustrationKey(themeForSteps, s.title),
        isStoryTimeStep: Boolean(s.isStoryTimeStep),
        isSongStep: Boolean(s.isSongStep),
      })),
    });
  }

  await prisma.routinePoster.update({
    where: { id: posterId },
    data: {
      title: data.title?.slice(0, 120),
      routineGoal: data.routineGoal?.slice(0, 200),
      theme: data.theme,
      favouriteColours: data.favouriteColours,
      numberOfChildren: data.numberOfChildren,
      layout: data.layout,
      category: data.category,
      celebrationText: data.celebrationText?.slice(0, 80),
      parentSignature: data.parentSignature,
      rewardEnabled: data.rewardEnabled,
      stickerSpaceEnabled: data.stickerSpaceEnabled,
      qrTarget: data.qrTarget,
    },
  });

  return getRoutinePoster(userId, posterId);
}

export async function deleteRoutinePoster(userId: string, posterId: string): Promise<void> {
  await prisma.routinePoster.updateMany({
    where: { id: posterId, userId },
    data: { deletedAt: new Date() },
  });
}

export async function recordPosterPrint(userId: string, posterId: string): Promise<void> {
  await prisma.routinePoster.updateMany({
    where: { id: posterId, userId },
    data: { printCount: { increment: 1 } },
  });
}

export async function recordPosterQrScan(posterId: string, userId?: string): Promise<RoutinePosterView | null> {
  const poster = await prisma.routinePoster.findFirst({
    where: { id: posterId, deletedAt: null },
  });
  if (!poster) return null;

  await prisma.routinePoster.update({
    where: { id: posterId },
    data: { qrScanCount: { increment: 1 } },
  });

  if (userId) {
    await prisma.posterAnalyticsEvent.create({
      data: {
        posterId,
        userId,
        eventType: "qr_scanned",
      },
    });
  }

  return getRoutinePoster(poster.userId, posterId);
}

export { toView as posterToView };
