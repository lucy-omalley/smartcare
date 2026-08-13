import "server-only";

import { startOfWeek } from "date-fns";
import { completeAI } from "@/lib/ai/provider";
import { prisma } from "@/lib/db";
import type { WeeklyGrowthReportContent } from "@/types/learning-plan";

export async function getOrGenerateWeeklyGrowthReport(
  userId: string
): Promise<{ content: WeeklyGrowthReportContent; cached: boolean }> {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const existing = await prisma.weeklyReflection.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  });

  if (existing?.content && typeof existing.content === "object") {
    const raw = existing.content as Record<string, unknown>;
    if (raw.reportType === "growth" && raw.sections) {
      return { content: raw.sections as WeeklyGrowthReportContent, cached: true };
    }
  }

  const [user, memories, messages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        childNickname: true,
        childAge: true,
        parentingGoals: true,
        currentChallenges: true,
      },
    }),
    prisma.familyMemory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { content: true, category: true },
    }),
    prisma.message.findMany({
      where: { conversation: { userId } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { content: true, isUser: true },
    }),
  ]);

  const memoryLines = memories
    .map((m) => `[${m.category}] ${m.content}`)
    .join("\n");
  const chatLines = messages
    .filter((m) => m.isUser)
    .slice(0, 8)
    .map((m) => m.content)
    .join("\n");

  const result = await completeAI({
    feature: "REFLECTION",
    userId,
    jsonMode: true,
    maxTokens: 800,
    temperature: 0.75,
    systemPrompt: `Write a warm weekly growth report for a parent. Return JSON with:
winsThisWeek (string), skillsPracticed (string[]), developmentProgress (string),
suggestedFocus (string), recommendedActivities (string[]), nextWeekGoals (string[]), encouragement (string).
Tone: supportive parenting coach, not clinical assessment.`,
    userPrompt: `Parent: ${user?.name ?? "Parent"}, child: ${user?.childNickname ?? "child"} (${user?.childAge ?? ""}).
Goals: ${user?.parentingGoals?.join(", ") ?? ""}.
Challenges: ${user?.currentChallenges?.join(", ") ?? ""}.
Memories this week:\n${memoryLines || "None yet"}
Recent parent messages:\n${chatLines || "None"}`,
  });

  let sections: WeeklyGrowthReportContent;
  try {
    sections = JSON.parse(result.content) as WeeklyGrowthReportContent;
  } catch {
    sections = {
      winsThisWeek: "You showed up consistently for your child this week.",
      skillsPracticed: ["Communication", "Patience", "Play"],
      developmentProgress: "Small daily moments are building confidence and connection.",
      suggestedFocus: user?.parentingGoals?.[0] ?? "Emotional connection",
      recommendedActivities: ["10-minute focused play", "Bedtime story routine"],
      nextWeekGoals: ["One screen-free activity daily", "Celebrate one small win"],
      encouragement: "You're doing meaningful work — progress beats perfection.",
    };
  }

  await prisma.weeklyReflection.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    create: {
      userId,
      weekStart,
      content: { reportType: "growth", sections } as object,
    },
    update: {
      content: { reportType: "growth", sections } as object,
    },
  });

  return { content: sections, cached: false };
}
