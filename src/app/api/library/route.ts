import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateLibraryRecommendations } from "@/lib/services/mumbot";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, memories, recentMessages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, childNickname: true, childAge: true, parentingGoal: true },
    }),
    prisma.familyMemory.findMany({
      where: { userId },
      select: { content: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.message.findMany({
      where: { conversation: { userId } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { content: true },
    }),
  ]);

  const recommendations = await generateLibraryRecommendations(
    user ?? {},
    memories,
    recentMessages.map((m) => m.content)
  );

  return NextResponse.json({ recommendations });
}
