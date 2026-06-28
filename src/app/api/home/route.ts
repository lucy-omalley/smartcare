import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateTodaysFocus, generateParentingTip } from "@/lib/services/mumbot";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, childNickname: true, childAge: true, parentingGoal: true },
  });

  const memories = await prisma.familyMemory.findMany({
    where: { userId: session.user.id },
    select: { content: true, category: true },
    take: 10,
  });

  const [todaysFocus, parentingTip, memoryCount, postCount, upcomingMeetups] = await Promise.all([
    generateTodaysFocus(user ?? {}, memories),
    generateParentingTip(),
    prisma.familyMemory.count({ where: { userId: session.user.id } }),
    prisma.communityPost.count(),
    prisma.meetup.count({ where: { date: { gte: new Date() } } }),
  ]);

  const conversation = await prisma.conversation.findFirst({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({
    todaysFocus,
    parentingTip,
    memoryCount,
    postCount,
    upcomingMeetups,
    lastConversation: conversation,
    profile: user,
  });
}
