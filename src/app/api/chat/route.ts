import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { getCachedDailyBrief } from "@/lib/services/daily-brief";
import { buildTodayPlanContextForMumBot } from "@/lib/services/today-recommendation-engine";
import { normalizeBriefContent } from "@/lib/today-plan-utils";
import { getMumBotResponse } from "@/lib/services/mumbot";
import { assertCanChat, assertCanUseAI, recordChatUsed } from "@/lib/ai/usage";
import { UsageLimitError } from "@/lib/ai/usage";
import { trackServerError } from "@/lib/analytics/server-errors";
import { checkMumBotRateLimit } from "@/lib/rate-limit";
import { aiGuardErrorResponse, requireAiSession } from "@/lib/auth/session-guards";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MUMBOT_BREAK_MESSAGE = "MumBot is taking a short break. Please try again in a moment.";

type IncomingMessage = { content: string; isUser: boolean; id?: string };

function toChatMessages(messages: IncomingMessage[]) {
  return messages
    .filter((m) => m.id !== "welcome" && m.content?.trim())
    .map((m) => ({ content: m.content.trim(), isUser: m.isUser }));
}

export async function POST(request: Request) {
  try {
    const guard = await requireAiSession();
    if (!guard.ok) {
      return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
    }

    if (!process.env.OPENAI_API_KEY?.trim()) {
      console.error("Chat API: OPENAI_API_KEY is not configured");
      return NextResponse.json(
        { error: MUMBOT_BREAK_MESSAGE, code: "OPENAI_NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    const { messages, conversationId } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request: messages array is required" }, { status: 400 });
    }

    const chatMessages = toChatMessages(messages);
    if (!chatMessages.some((m) => m.isUser)) {
      return NextResponse.json({ error: "No user message to respond to" }, { status: 400 });
    }

    const userId = guard.userId;

    const rateLimit = await checkMumBotRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `You've sent quite a few messages recently. Please try again in ${rateLimit.retryAfterMinutes ?? 15} minutes.`,
          code: "RATE_LIMIT",
        },
        { status: 429 }
      );
    }

    try {
      await assertCanChat(userId);
      await assertCanUseAI(userId);
    } catch (err) {
      if (err instanceof UsageLimitError) {
        return NextResponse.json({ error: err.message }, { status: 429 });
      }
      throw err;
    }

    const [user, memories, todayBrief] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          childNickname: true,
          childAge: true,
          childInterests: true,
          foodPreferences: true,
          routineNotes: true,
          developmentNotes: true,
          parentingGoal: true,
          parentingGoals: true,
          currentChallenges: true,
        },
      }),
      prisma.familyMemory.findMany({
        where: { userId },
        select: { content: true, category: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      getCachedDailyBrief(userId),
    ]);

    const normalizedBrief = todayBrief ? normalizeBriefContent(todayBrief) : null;
    const todayPlanContext = normalizedBrief
      ? buildTodayPlanContextForMumBot(normalizedBrief, user?.childNickname)
      : undefined;

    const { response, suggestedMemory } = await getMumBotResponse(chatMessages, {
      memories,
      profile: user ?? undefined,
      todayPlanContext,
      userId,
    });

    await recordChatUsed(userId);

    let activeConversationId = conversationId as string | undefined;

    if (activeConversationId) {
      const existing = await prisma.conversation.findFirst({
        where: { id: activeConversationId, userId },
        select: { id: true },
      });
      if (!existing) activeConversationId = undefined;
    }

    const lastUserMsg = chatMessages.filter((m) => m.isUser).pop();

    if (!activeConversationId) {
      const conv = await prisma.conversation.create({
        data: { userId, title: lastUserMsg?.content?.slice(0, 50) || "Chat with MumBot" },
      });
      activeConversationId = conv.id;
    }

    if (lastUserMsg) {
      await prisma.message.create({
        data: {
          conversationId: activeConversationId,
          content: lastUserMsg.content,
          isUser: true,
        },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: activeConversationId,
        content: response,
        isUser: false,
      },
    });

    return NextResponse.json({
      response,
      suggestedMemory,
      conversationId: activeConversationId,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const session = await getServerSession(authOptions);
    await trackServerError(
      "openai_chat",
      error,
      session?.user?.id,
      { provider: "openai" }
    );
    const errMsg = error instanceof Error ? error.message : String(error);
    let message = MUMBOT_BREAK_MESSAGE;
    let code = "CHAT_ERROR";
    if (errMsg.includes("API key") || errMsg.includes("invalid_api_key")) {
      code = "OPENAI_AUTH";
    } else if (errMsg.includes("quota") || errMsg.includes("billing")) {
      message = "MumBot is temporarily unavailable due to AI service limits. Please try again later.";
      code = "OPENAI_QUOTA";
    }
    return NextResponse.json({ error: message, code }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Chat GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
