import "server-only";

import { prisma } from "@/lib/db";

function isMissingSavedAdventuresTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  if (code === "P2021") return true;
  const message = String((error as { message?: string }).message ?? error);
  return message.includes("SavedFamilyAdventure") && message.includes("does not exist");
}

/** Reads wishlist IDs; returns [] if the table has not been migrated yet. */
export async function listSavedAdventureIds(userId: string): Promise<string[]> {
  try {
    const saved = await prisma.savedFamilyAdventure.findMany({
      where: { userId },
      select: { adventureId: true },
    });
    return saved.map((row) => row.adventureId);
  } catch (error) {
    if (isMissingSavedAdventuresTable(error)) {
      console.warn("[family-adventures] SavedFamilyAdventure table missing — run db push");
      return [];
    }
    throw error;
  }
}

export async function isAdventureSaved(userId: string, adventureId: string): Promise<boolean> {
  try {
    const saved = await prisma.savedFamilyAdventure.findUnique({
      where: { userId_adventureId: { userId, adventureId } },
      select: { id: true },
    });
    return Boolean(saved);
  } catch (error) {
    if (isMissingSavedAdventuresTable(error)) return false;
    throw error;
  }
}

export async function saveAdventureForUser(userId: string, adventureId: string) {
  try {
    return await prisma.savedFamilyAdventure.upsert({
      where: { userId_adventureId: { userId, adventureId } },
      create: { userId, adventureId },
      update: {},
    });
  } catch (error) {
    if (isMissingSavedAdventuresTable(error)) {
      throw new Error("Saving adventures is not available yet. Please try again shortly.");
    }
    throw error;
  }
}

export async function unsaveAdventureForUser(userId: string, adventureId: string) {
  try {
    await prisma.savedFamilyAdventure.deleteMany({ where: { userId, adventureId } });
  } catch (error) {
    if (isMissingSavedAdventuresTable(error)) return;
    throw error;
  }
}
