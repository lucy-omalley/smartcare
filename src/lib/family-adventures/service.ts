import "server-only";

import { prisma } from "@/lib/db";
import { ADVENTURE_COLLECTIONS } from "@/lib/family-adventures/collections";
import { getAdventureById } from "@/lib/family-adventures/connectors";
import {
  buildHeroMessage,
  buildRecommendationContext,
  recommendFamilyAdventures,
} from "@/lib/family-adventures/recommender";
import type { AdventureFilters, FamilyAdventuresView } from "@/lib/family-adventures/types";
import { fetchWeatherForLocation } from "@/lib/services/weather";

export async function getFamilyAdventuresView(
  userId: string,
  filters?: AdventureFilters
): Promise<FamilyAdventuresView> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      childNickname: true,
      childAge: true,
      childBirthday: true,
      childInterests: true,
      favouriteToys: true,
      favouriteAnimal: true,
      favouriteVehicle: true,
      weeklyFocusTitle: true,
      location: true,
      broadArea: true,
    },
  });

  if (!user) throw new Error("User not found");

  const [saved, attendedMemories, weatherResult] = await Promise.all([
    prisma.savedFamilyAdventure.findMany({
      where: { userId },
      select: { adventureId: true },
    }),
    prisma.familyMemory.findMany({
      where: { userId, category: "LEARNING" },
      select: { content: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
    fetchWeatherForLocation(user.location ?? user.broadArea ?? "Dublin, IE"),
  ]);

  const ctx = buildRecommendationContext(user);
  ctx.savedIds = saved.map((s) => s.adventureId);
  ctx.attendedTitles = attendedMemories
    .filter((m) => m.content.startsWith("Family Adventure:"))
    .map((m) => m.content.replace("Family Adventure:", "").trim().split("\n")[0] ?? "");
  ctx.isRainy = weatherResult.weather?.isRainy ?? false;

  const recommendations = await recommendFamilyAdventures(ctx, filters, 3);
  const weatherNote =
    weatherResult.weather?.playSuggestion ??
    (ctx.isRainy ? "Rainy today — indoor adventures recommended." : "Lovely day for exploring nearby.");

  return {
    subtitle: "Discover personalised experiences near you.",
    heroMessage: buildHeroMessage(ctx.isRainy, recommendations.length),
    recommendationCount: recommendations.length,
    weatherNote,
    isRainy: ctx.isRainy,
    recommendations,
    collections: ADVENTURE_COLLECTIONS,
    savedIds: ctx.savedIds,
    childName: ctx.childName,
  };
}

export async function getFamilyAdventureDetail(userId: string, adventureId: string) {
  const adventure = await getAdventureById(adventureId);
  if (!adventure) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      childNickname: true,
      childAge: true,
      childBirthday: true,
      childInterests: true,
      favouriteToys: true,
      weeklyFocusTitle: true,
      favouriteAnimal: true,
      favouriteVehicle: true,
      location: true,
      broadArea: true,
    },
  });

  if (!user) throw new Error("User not found");

  const [saved, weatherResult] = await Promise.all([
    prisma.savedFamilyAdventure.findUnique({
      where: { userId_adventureId: { userId, adventureId } },
    }),
    fetchWeatherForLocation(user.location ?? user.broadArea ?? "Dublin, IE"),
  ]);

  const ctx = buildRecommendationContext(user);
  ctx.isRainy = weatherResult.weather?.isRainy ?? false;

  const allScored = await recommendFamilyAdventures(ctx, undefined, 100);
  const matched = allScored.find((r) => r.id === adventureId);

  return {
    adventure:
      matched ??
      ({
        ...adventure,
        matchScore: 65,
        matchStars: 3,
        whyRecommended: ["A wonderful outing for your family"],
        collectionIds: [],
      } as const),
    isSaved: Boolean(saved),
    childName: ctx.childName,
  };
}

export async function saveFamilyAdventure(userId: string, adventureId: string) {
  return prisma.savedFamilyAdventure.upsert({
    where: { userId_adventureId: { userId, adventureId } },
    create: { userId, adventureId },
    update: {},
  });
}

export async function unsaveFamilyAdventure(userId: string, adventureId: string) {
  await prisma.savedFamilyAdventure.deleteMany({ where: { userId, adventureId } });
}

export async function markAdventureAttended(userId: string, adventureId: string, note?: string) {
  const adventure = await getAdventureById(adventureId);
  if (!adventure) throw new Error("Adventure not found");

  await prisma.familyMemory.create({
    data: {
      userId,
      category: "LEARNING",
      content: `Family Adventure: ${adventure.title}\n${note ?? adventure.description.slice(0, 120)}`,
    },
  });

  return adventure;
}
