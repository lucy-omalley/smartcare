import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateWeeklyReflection } from "@/lib/services/mumbot";
import { startOfWeek } from "date-fns";
import { aiGuardErrorResponse, requireAiSession } from "@/lib/auth/session-guards";

export async function GET() {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  let reflection = await prisma.weeklyReflection.findUnique({
    where: {
      userId_weekStart: { userId: guard.userId, weekStart },
    },
  });

  if (!reflection) {
    const user = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: { name: true, childNickname: true, parentingGoal: true },
    });

    const memories = await prisma.familyMemory.findMany({
      where: { userId: guard.userId },
      select: { content: true, category: true },
    });

    const recentMessages = await prisma.message.findMany({
      where: { conversation: { userId: guard.userId } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { content: true },
    });

    const content = await generateWeeklyReflection(
      user ?? {},
      memories,
      recentMessages.map((m) => m.content)
    );

    reflection = await prisma.weeklyReflection.create({
      data: {
        userId: guard.userId,
        weekStart,
        content,
      },
    });
  }

  return NextResponse.json({ reflection });
}
