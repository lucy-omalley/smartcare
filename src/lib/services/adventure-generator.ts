import "server-only";

import { completeAI } from "@/lib/ai/provider";
import type { AdventureFormat, RoutinePoster } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseAdventurePayload, adventureGenerationSystemPrompt } from "@/lib/adventure/adventure-json";
import { missionIllustrationEmoji } from "@/lib/adventure/constants";
import {
  assertCanCreatePoster,
  assertCanUseAiPoster,
  assertFormatAllowed,
  assertThemeAllowed,
  getPosterFeatures,
} from "@/lib/adventure/gating";
import { resolveIllustrationKey } from "@/lib/posters/illustration-service";
import { getThemeStyle } from "@/lib/posters/themes";
import { buildTemplateRoutine } from "@/lib/routines/templates";
import { stepCountForLength } from "@/lib/routines/constants";
import { categoryForTemplate } from "@/lib/posters/constants";
import type {
  AdventureJourneyView,
  GenerateAdventureInput,
  GeneratedAdventurePayload,
} from "@/types/adventure-journey";

const SYSTEM = adventureGenerationSystemPrompt(
  `Create a story adventure where each routine step is a mission page in an ongoing narrative.
The child is the hero. Use theme-appropriate character names (Captain Dino, Princess Lily, etc.).`
);

type StepRow = {
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
};

function toView(
  poster: RoutinePoster & { steps: StepRow[] }
): AdventureJourneyView {
  const pages = poster.steps.sort((a, b) => a.orderIndex - b.orderIndex);
  const totalRewardStars = pages.reduce((s, p) => s + (p.rewardStars ?? 1), 0);
  const pageViews = pages.map((s) => ({
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

function templateToAdventure(input: GenerateAdventureInput): GeneratedAdventurePayload {
  const themeStyle = getThemeStyle(input.theme);
  const characterName = `Captain ${input.childName}`;
  const template = buildTemplateRoutine({
    templateType: input.templateType,
    childName: input.childName,
    length: input.length,
    primaryInterest: input.interests[0] ?? input.theme.toLowerCase(),
  });

  return {
    title: `${input.childName}'s ${themeStyle.label} Adventure`,
    characterName,
    storyIntro: `${characterName} is ready for today's ${themeStyle.label.toLowerCase()} adventure! Can you help complete every mission?`,
    storyEnding: `Congratulations! ${characterName} is ready for tomorrow's adventure!`,
    celebrationText: themeStyle.celebration,
    routineGoal: `Build confidence and independence through ${input.childName}'s adventure.`,
    pages: template.steps.map((s, i) => ({
      storyText: `${characterName} needs to: ${s.instruction}`,
      missionLabel: s.title,
      title: s.title,
      iconEmoji: s.iconEmoji,
      illustrationKey: resolveIllustrationKey(input.theme, s.title),
      rewardStars: i === template.steps.length - 1 ? 2 : 1,
      isStoryTimeStep: s.isStoryTimeStep,
      isSongStep: s.title.toLowerCase().includes("song"),
    })),
  };
}

async function persistAdventure(
  input: GenerateAdventureInput,
  payload: GeneratedAdventurePayload,
  isAiGenerated: boolean
): Promise<AdventureJourneyView> {
  const features = await getPosterFeatures(input.userId);
  assertThemeAllowed(input.theme, features.isPremium);
  if (input.adventureFormat) assertFormatAllowed(input.adventureFormat, features.isPremium);

  const totalStars = payload.pages.reduce((s, p) => s + (p.rewardStars ?? 1), 0);

  const poster = await prisma.routinePoster.create({
    data: {
      userId: input.userId,
      title: payload.title.slice(0, 120),
      routineGoal: payload.routineGoal.slice(0, 200) || null,
      characterName: payload.characterName.slice(0, 80) || null,
      storyIntro: payload.storyIntro.slice(0, 500) || null,
      storyEnding: payload.storyEnding.slice(0, 300) || null,
      storyTheme: input.storyTheme,
      adventureFormat: input.adventureFormat ?? "STORY_BOOK",
      totalRewardStars: totalStars,
      adventurePoints: totalStars * 10,
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
      isAiGenerated,
      steps: {
        create: payload.pages.map((p, i) => ({
          orderIndex: i,
          title: p.missionLabel.slice(0, 60),
          storyText: p.storyText.slice(0, 400),
          missionLabel: p.missionLabel.slice(0, 60),
          iconEmoji: p.iconEmoji.slice(0, 8) || "⭐",
          illustrationKey: p.illustrationKey ?? resolveIllustrationKey(input.theme, p.missionLabel),
          rewardStars: p.rewardStars ?? 1,
          pageQrTarget: p.isStoryTimeStep ? "TODAY_STORY" : p.isSongStep ? "TODAY_SONG" : null,
          isStoryTimeStep: Boolean(p.isStoryTimeStep),
          isSongStep: Boolean(p.isSongStep),
        })),
      },
    },
    include: { steps: true },
  });

  return toView(poster as RoutinePoster & { steps: StepRow[] });
}

export async function generateAdventureJourney(input: GenerateAdventureInput): Promise<AdventureJourneyView> {
  await assertCanCreatePoster(input.userId);
  await assertCanUseAiPoster(input.userId);

  const fallback = templateToAdventure(input);

  try {
    const themeStyle = getThemeStyle(input.theme);
    const userPrompt = JSON.stringify({
      templateType: input.templateType,
      childName: input.childName,
      childAge: input.childAge ?? "preschool",
      interests: input.interests,
      storyTheme: input.storyTheme,
      theme: themeStyle.label,
      themeEmoji: themeStyle.emoji,
      challenge: input.challenge,
      parentGoals: input.parentGoals,
      targetPages: stepCountForLength(input.length),
    });

    const result = await completeAI({
      feature: "ADVENTURE_GENERATION",
      systemPrompt: SYSTEM,
      userPrompt,
      maxTokens: 2200,
      temperature: 0.88,
      jsonMode: true,
      userId: input.userId,
    });

    if (!result.content?.trim()) throw new Error("Empty AI response");
    const payload = parseAdventurePayload(result.content);
    payload.pages = payload.pages.map((p) => ({
      ...p,
      iconEmoji: p.iconEmoji || missionIllustrationEmoji(p.missionLabel, "⭐"),
      illustrationKey: p.illustrationKey ?? resolveIllustrationKey(input.theme, p.missionLabel),
    }));
    return persistAdventure(input, payload, true);
  } catch {
    return persistAdventure(input, fallback, false);
  }
}

export async function createAdventureFromTemplate(input: GenerateAdventureInput): Promise<AdventureJourneyView> {
  await assertCanCreatePoster(input.userId);
  return persistAdventure(input, templateToAdventure(input), false);
}

export async function listAdventureJourneys(userId: string): Promise<AdventureJourneyView[]> {
  const posters = await prisma.routinePoster.findMany({
    where: { userId, deletedAt: null },
    include: { steps: { orderBy: { orderIndex: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  return posters.map((p) => toView(p as RoutinePoster & { steps: StepRow[] }));
}

export async function getAdventureJourney(userId: string, id: string): Promise<AdventureJourneyView | null> {
  const poster = await prisma.routinePoster.findFirst({
    where: { id, userId, deletedAt: null },
    include: { steps: { orderBy: { orderIndex: "asc" } } },
  });
  if (!poster) return null;
  return toView(poster as RoutinePoster & { steps: StepRow[] });
}

export async function updateAdventureJourney(
  userId: string,
  id: string,
  data: {
    title?: string;
    routineGoal?: string | null;
    characterName?: string | null;
    storyIntro?: string | null;
    storyEnding?: string | null;
    theme?: RoutinePoster["theme"];
    storyTheme?: RoutinePoster["storyTheme"];
    adventureFormat?: AdventureFormat;
    favouriteColours?: string[];
    numberOfChildren?: number;
    celebrationText?: string;
    layout?: RoutinePoster["layout"];
    category?: RoutinePoster["category"];
    parentSignature?: string | null;
    rewardEnabled?: boolean;
    stickerSpaceEnabled?: boolean;
    qrTarget?: RoutinePoster["qrTarget"];
    pages?: Array<{
      title: string;
      storyText?: string;
      missionLabel?: string;
      iconEmoji: string;
      rewardStars?: number;
      isStoryTimeStep?: boolean;
      isSongStep?: boolean;
    }>;
    /** @deprecated alias for pages */
    steps?: Array<{
      title: string;
      storyText?: string;
      missionLabel?: string;
      iconEmoji: string;
      rewardStars?: number;
      isStoryTimeStep?: boolean;
      isSongStep?: boolean;
    }>;
  }
): Promise<AdventureJourneyView | null> {
  const pageUpdates = data.pages ?? data.steps;
  const existing = await prisma.routinePoster.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) return null;

  if (data.theme) {
    const features = await getPosterFeatures(userId);
    assertThemeAllowed(data.theme, features.isPremium);
  }
  if (data.adventureFormat) {
    const features = await getPosterFeatures(userId);
    assertFormatAllowed(data.adventureFormat, features.isPremium);
  }

  const themeForSteps = data.theme ?? existing.theme;

  if (pageUpdates) {
    await prisma.routinePosterStep.deleteMany({ where: { posterId: id } });
    await prisma.routinePosterStep.createMany({
      data: pageUpdates.map((p, i) => ({
        posterId: id,
        orderIndex: i,
        title: (p.missionLabel ?? p.title).slice(0, 60),
        storyText: (p.storyText ?? "").slice(0, 400),
        missionLabel: (p.missionLabel ?? p.title).slice(0, 60),
        iconEmoji: p.iconEmoji.slice(0, 8) || "⭐",
        illustrationKey: resolveIllustrationKey(themeForSteps, p.missionLabel ?? p.title),
        rewardStars: p.rewardStars ?? 1,
        pageQrTarget: p.isStoryTimeStep ? "TODAY_STORY" : p.isSongStep ? "TODAY_SONG" : null,
        isStoryTimeStep: Boolean(p.isStoryTimeStep),
        isSongStep: Boolean(p.isSongStep),
      })),
    });
    const totalStars = pageUpdates.reduce((s, p) => s + (p.rewardStars ?? 1), 0);
    await prisma.routinePoster.update({
      where: { id },
      data: { totalRewardStars: totalStars, adventurePoints: totalStars * 10 },
    });
  }

  await prisma.routinePoster.update({
    where: { id },
    data: {
      title: data.title?.slice(0, 120),
      routineGoal: data.routineGoal?.slice(0, 200),
      characterName: data.characterName?.slice(0, 80),
      storyIntro: data.storyIntro?.slice(0, 500),
      storyEnding: data.storyEnding?.slice(0, 300),
      theme: data.theme,
      storyTheme: data.storyTheme,
      adventureFormat: data.adventureFormat,
      favouriteColours: data.favouriteColours,
      numberOfChildren: data.numberOfChildren,
      category: data.category,
      celebrationText: data.celebrationText?.slice(0, 80),
      parentSignature: data.parentSignature,
      rewardEnabled: data.rewardEnabled,
      stickerSpaceEnabled: data.stickerSpaceEnabled,
      qrTarget: data.qrTarget,
      layout: data.layout,
    },
  });

  return getAdventureJourney(userId, id);
}

export {
  deleteRoutinePoster as deleteAdventureJourney,
  recordPosterPrint as recordAdventurePrint,
  recordPosterQrScan as recordAdventureQrScan,
} from "@/lib/services/poster-generator";

export { getPosterFeatures as getAdventureFeatures } from "@/lib/adventure/gating";

export const listRoutinePosters = listAdventureJourneys;
export const getRoutinePoster = getAdventureJourney;
export const generateRoutinePoster = generateAdventureJourney;
export const createPosterFromTemplate = createAdventureFromTemplate;
export const updateRoutinePoster = updateAdventureJourney;
