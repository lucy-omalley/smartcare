import "server-only";

import type { ToyCategory, ToyProfile, ToyScanStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { completeAI } from "@/lib/ai/provider";
import { completeVision } from "@/lib/ai/vision";
import { enrichProfileWithChildAge } from "@/lib/child-age";
import type { BriefProfile } from "@/lib/daily-brief-context";
import {
  activityLimitForPlan,
  assertCanScanToy,
  assertCanUseAiToyBrain,
  getToyBrainFeatures,
  recordToyScan,
} from "@/lib/toy-brain/gating";
import { getTemplateActivities, mergeActivities } from "@/lib/toy-brain/play-templates";
import {
  parseToyActivities,
  parseToyIdentification,
  toyIdentifySystemPrompt,
  toyPlayIdeasSystemPrompt,
} from "@/lib/toy-brain/toy-json";
import type { ToyIdentificationResult, ToyPlayActivity, ToyProfileView } from "@/types/toy-brain";
import { updateDailyBriefSection } from "@/lib/services/daily-brief";
import type { DailyBriefPlay } from "@/types/daily-brief";

function parseActivitiesJson(raw: unknown): ToyPlayActivity[] {
  if (!Array.isArray(raw)) return [];
  return raw as ToyPlayActivity[];
}

function toView(toy: ToyProfile): ToyProfileView {
  return {
    id: toy.id,
    name: toy.name,
    category: toy.category,
    confidence: toy.confidence,
    recommendedAge: toy.recommendedAge,
    description: toy.description,
    photoData: toy.photoData,
    mimeType: toy.mimeType,
    isConfirmed: toy.isConfirmed,
    isFavourite: toy.isFavourite,
    activities: parseActivitiesJson(toy.activities),
    addedToTodayAt: toy.addedToTodayAt?.toISOString() ?? null,
    lastPlayedAt: toy.lastPlayedAt?.toISOString() ?? null,
    scanStatus: toy.scanStatus,
    createdAt: toy.createdAt.toISOString(),
    updatedAt: toy.updatedAt.toISOString(),
  };
}

async function loadChildContext(userId: string): Promise<BriefProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  return enrichProfileWithChildAge(user) as BriefProfile;
}

async function syncFavouriteToy(userId: string, toyName: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { favouriteToys: true },
  });
  if (!user) return;
  const name = toyName.trim();
  if (!name || user.favouriteToys.includes(name)) return;
  await prisma.user.update({
    where: { id: userId },
    data: { favouriteToys: [...user.favouriteToys, name].slice(-20) },
  });
}

function buildPlayPrompt(
  profile: BriefProfile,
  toy: { name: string; category: ToyCategory; recommendedAge?: string | null },
  count: number
): string {
  return JSON.stringify({
    toyName: toy.name,
    category: toy.category,
    recommendedAge: toy.recommendedAge ?? profile.childAge ?? "preschool",
    childName: profile.childNickname ?? "your child",
    childAge: profile.childAge,
    interests: profile.childInterests ?? [],
    favouriteToys: profile.favouriteToys ?? [],
    parentGoals: profile.parentingGoals ?? profile.parentingGoal,
    challenges: profile.currentChallenges ?? [],
    homeLanguage: profile.homeLanguage,
    activityCount: count,
  });
}

async function generatePlayActivities(
  userId: string,
  toy: { name: string; category: ToyCategory; recommendedAge?: string | null },
  useAi: boolean
): Promise<ToyPlayActivity[]> {
  const features = await getToyBrainFeatures(userId);
  const limit = activityLimitForPlan(features.isPremium);
  const templates = getTemplateActivities(toy.category, toy.name).slice(0, limit);

  if (!useAi || !features.aiPersonalization) {
    return templates.slice(0, limit);
  }

  try {
    await assertCanUseAiToyBrain(userId);
    const profile = await loadChildContext(userId);
    const result = await completeAI({
      feature: "TOY_BRAIN_PLAY_IDEAS",
      systemPrompt: toyPlayIdeasSystemPrompt(),
      userPrompt: buildPlayPrompt(profile, toy, limit),
      maxTokens: 2800,
      temperature: 0.85,
      jsonMode: true,
      userId,
      cacheKey: `toy-play:${toy.category}:${profile.childAge}:${profile.childInterests?.slice(0, 3).join(",")}`,
      cacheTtlSeconds: 86400 * 7,
    });
    if (!result.content?.trim()) throw new Error("Empty AI response");
    const aiActivities = parseToyActivities(result.content, toy.name);
    return mergeActivities(templates, aiActivities, limit);
  } catch {
    return templates.slice(0, limit);
  }
}

export async function identifyToyFromPhoto(
  userId: string,
  photoData: string,
  mimeType: string
): Promise<ToyIdentificationResult> {
  const result = await completeVision({
    feature: "TOY_BRAIN_IDENTIFY",
    imageBase64: photoData,
    mimeType,
    systemPrompt: toyIdentifySystemPrompt(),
    userPrompt: "Identify the main toy in this photo for a parent of a preschool child.",
    jsonMode: true,
    userId,
    maxTokens: 400,
  });
  if (!result.content?.trim()) throw new Error("Could not identify toy — try a clearer photo.");
  return parseToyIdentification(result.content);
}

export async function scanToyPhoto(input: {
  userId: string;
  photoData: string;
  mimeType: string;
  useAi?: boolean;
}): Promise<ToyProfileView> {
  await assertCanScanToy(input.userId);

  const identification = await identifyToyFromPhoto(input.userId, input.photoData, input.mimeType);
  const activities = await generatePlayActivities(
    input.userId,
    identification,
    input.useAi !== false
  );

  const toy = await prisma.toyProfile.create({
    data: {
      userId: input.userId,
      name: identification.name.slice(0, 120),
      category: identification.category,
      confidence: identification.confidence,
      recommendedAge: identification.recommendedAge.slice(0, 40),
      description: identification.description.slice(0, 500),
      photoData: input.photoData.slice(0, 500_000),
      mimeType: input.mimeType.slice(0, 40),
      activities: activities as object[],
      scanStatus: "IDENTIFIED",
    },
  });

  await recordToyScan(input.userId);
  await syncFavouriteToy(input.userId, identification.name);

  return toView(toy);
}

export async function createManualToy(input: {
  userId: string;
  name: string;
  category: ToyCategory;
  useAi?: boolean;
}): Promise<ToyProfileView> {
  await assertCanScanToy(input.userId);

  const activities = await generatePlayActivities(
    input.userId,
    { name: input.name, category: input.category },
    input.useAi !== false
  );

  const toy = await prisma.toyProfile.create({
    data: {
      userId: input.userId,
      name: input.name.slice(0, 120),
      category: input.category,
      confidence: 1,
      recommendedAge: null,
      description: `Manually added: ${input.name}`,
      isConfirmed: true,
      activities: activities as object[],
      scanStatus: "MANUAL",
    },
  });

  await recordToyScan(input.userId);
  await syncFavouriteToy(input.userId, input.name);

  return toView(toy);
}

export async function listToyProfiles(userId: string): Promise<ToyProfileView[]> {
  const toys = await prisma.toyProfile.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
  return toys.map(toView);
}

export async function getToyProfile(userId: string, id: string): Promise<ToyProfileView | null> {
  const toy = await prisma.toyProfile.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!toy) return null;
  return toView(toy);
}

export async function confirmToyIdentification(
  userId: string,
  id: string,
  data: { name?: string; category?: ToyCategory; confirmed: boolean }
): Promise<ToyProfileView | null> {
  const existing = await prisma.toyProfile.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) return null;

  const name = (data.name ?? existing.name).slice(0, 120);
  const category = data.category ?? existing.category;

  let activities = parseActivitiesJson(existing.activities);
  if (data.confirmed && (data.name || data.category)) {
    activities = await generatePlayActivities(userId, { name, category }, true);
  }

  const toy = await prisma.toyProfile.update({
    where: { id },
    data: {
      name,
      category,
      isConfirmed: data.confirmed,
      scanStatus: data.confirmed ? "CONFIRMED" : existing.scanStatus,
      activities: activities as object[],
    },
  });

  if (data.confirmed) await syncFavouriteToy(userId, name);
  return toView(toy);
}

export async function regenerateToyActivities(
  userId: string,
  id: string
): Promise<ToyProfileView | null> {
  const existing = await prisma.toyProfile.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) return null;

  const activities = await generatePlayActivities(
    userId,
    { name: existing.name, category: existing.category, recommendedAge: existing.recommendedAge },
    true
  );

  const toy = await prisma.toyProfile.update({
    where: { id },
    data: { activities: activities as object[] },
  });
  return toView(toy);
}

export async function updateToyProfile(
  userId: string,
  id: string,
  data: {
    name?: string;
    category?: ToyCategory;
    isFavourite?: boolean;
    activities?: ToyPlayActivity[];
  }
): Promise<ToyProfileView | null> {
  const existing = await prisma.toyProfile.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) return null;

  const toy = await prisma.toyProfile.update({
    where: { id },
    data: {
      name: data.name?.slice(0, 120),
      category: data.category,
      isFavourite: data.isFavourite,
      activities: data.activities ? (data.activities as object[]) : undefined,
      lastPlayedAt: data.activities ? new Date() : undefined,
    },
  });
  return toView(toy);
}

export async function deleteToyProfile(userId: string, id: string): Promise<void> {
  await prisma.toyProfile.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
}

export async function addToyActivityToTodayPlan(
  userId: string,
  toyId: string,
  activityId: string
): Promise<{ toy: ToyProfileView; play: DailyBriefPlay } | null> {
  const features = await getToyBrainFeatures(userId);
  if (!features.isPremium) {
    throw new Error("Adding Toy Brain activities to Today's Plan is a Premium feature. Upgrade to unlock.");
  }

  const toy = await prisma.toyProfile.findFirst({ where: { id: toyId, userId, deletedAt: null } });
  if (!toy) return null;

  const activities = parseActivitiesJson(toy.activities);
  const activity = activities.find((a) => a.id === activityId);
  if (!activity) throw new Error("Activity not found.");

  const play: DailyBriefPlay = {
    title: activity.title,
    materials: activity.materials,
    instructions: activity.instructions,
    detailedInstructions: [
      ...activity.instructions,
      ...(activity.parentTips.length ? ["Parent tips:", ...activity.parentTips] : []),
      ...(activity.questionsToAsk.length ? ["Questions to ask:", ...activity.questionsToAsk] : []),
    ],
    skillsDeveloped: activity.skills.map((s) => s.replace(/_/g, " ")),
    durationMinutes: activity.durationMinutes,
    indoorOutdoor: activity.indoorOutdoor,
    reason: `From your ${toy.name} — Toy Brain play idea`,
    ageRecommendation: toy.recommendedAge ?? undefined,
  };

  await updateDailyBriefSection(userId, "play", play);

  const updated = await prisma.toyProfile.update({
    where: { id: toyId },
    data: { addedToTodayAt: new Date(), lastPlayedAt: new Date() },
  });

  return { toy: toView(updated), play };
}

export async function getToyRecommendations(userId: string): Promise<string[]> {
  const toys = await prisma.toyProfile.findMany({
    where: { userId, deletedAt: null },
    orderBy: { lastPlayedAt: "asc" },
    take: 5,
  });

  const tips: string[] = [];
  const stale = toys.filter((t) => {
    if (!t.lastPlayedAt) return true;
    const days = (Date.now() - t.lastPlayedAt.getTime()) / (86400 * 1000);
    return days > 14;
  });

  if (stale[0]) {
    tips.push(`You haven't played with ${stale[0].name} in a while — try a fresh activity today!`);
  }

  const profile = await loadChildContext(userId);
  if (profile.childInterests?.[0] && toys[0]) {
    tips.push(
      `${profile.childNickname ?? "Your child"} loves ${profile.childInterests[0]} — combine it with ${toys[0].name} for a new adventure.`
    );
  }

  return tips.slice(0, 3);
}

export { getToyBrainFeatures };
