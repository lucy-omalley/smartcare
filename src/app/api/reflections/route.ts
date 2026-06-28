import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateWeeklyReflection } from "@/lib/services/mumbot";
import { startOfWeek } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  let reflection = await prisma.weeklyReflection.findUnique({
    where: {
      userId_weekStart: { userId: session.user.id, weekStart },
    },
  });

  if (!reflection) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, childNickname: true, parentingGoal: true },
    });

    const memories = await prisma.familyMemory.findMany({
      where: { userId: session.user.id },
      select: { content: true, category: true },
    });

    const recentMessages = await prisma.message.findMany({
      where: { conversation: { userId: session.user.id } },
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
        userId: session.user.id,
        weekStart,
        content,
      },
    });
  }

  return NextResponse.json({ reflection });
}
