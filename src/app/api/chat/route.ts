import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { getMumBotResponse } from "@/lib/services/mumbot";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { messages, conversationId } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request: messages array is required" }, { status: 400 });
    }

    const userId = session?.user?.id;
    let memories: { content: string; category: import("@prisma/client").MemoryCategory }[] = [];
    let profile = undefined;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          childNickname: true,
          childAge: true,
          parentingGoal: true,
        },
      });
      profile = user ?? undefined;

      memories = await prisma.familyMemory.findMany({
        where: { userId },
        select: { content: true, category: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    }

    const chatMessages = messages.map((m: { content: string; isUser: boolean }) => ({
      content: m.content,
      isUser: m.isUser,
    }));

    const { response, suggestedMemory } = await getMumBotResponse(chatMessages, { memories, profile });

    let activeConversationId = conversationId;

    if (userId) {
      const lastUserMsg = messages.filter((m: { isUser: boolean }) => m.isUser).pop();

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
    }

    return NextResponse.json({
      response,
      suggestedMemory,
      conversationId: activeConversationId,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
