import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import {
  isLegacySavedActivityMemory,
  legacyMemoryToPlay,
} from "@/lib/saved-activities";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [saved, legacyMemories] = await Promise.all([
    prisma.savedActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.familyMemory.findMany({
      where: { userId, category: "LEARNING" },
      orderBy: { createdAt: "desc" },
      select: { id: true, content: true, createdAt: true },
    }),
  ]);

  const legacy = legacyMemories
    .filter((m) => isLegacySavedActivityMemory(m.content))
    .map((m) => ({
      id: m.id,
      title: legacyMemoryToPlay(m.content).title,
      content: legacyMemoryToPlay(m.content),
      createdAt: m.createdAt.toISOString(),
      source: "memory" as const,
    }));

  const activities = [
    ...saved.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      createdAt: a.createdAt.toISOString(),
      source: "saved" as const,
    })),
    ...legacy,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ activities });
}
