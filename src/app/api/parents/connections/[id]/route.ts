import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await request.json();
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const connection = await prisma.parentConnection.findUnique({
    where: { id: params.id },
  });

  if (!connection || connection.recipientId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (connection.status !== "PENDING") {
    return NextResponse.json({ error: "Request already handled" }, { status: 400 });
  }

  if (action === "decline") {
    const updated = await prisma.parentConnection.update({
      where: { id: params.id },
      data: { status: "DECLINED" },
    });
    return NextResponse.json({ connection: updated });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const conn = await tx.parentConnection.update({
      where: { id: params.id },
      data: { status: "ACCEPTED" },
    });
    const thread = await tx.parentThread.create({
      data: { connectionId: conn.id },
    });

    if (connection.introMessage?.trim()) {
      await tx.parentMessage.create({
        data: {
          threadId: thread.id,
          senderId: connection.requesterId,
          content: connection.introMessage.trim(),
        },
      });
    }

    const welcome = await tx.parentMessage.create({
      data: {
        threadId: thread.id,
        senderId: session.user.id,
        content: "Hi! Lovely to connect — looking forward to chatting 🙂",
      },
    });

    await tx.parentThread.update({
      where: { id: thread.id },
      data: { updatedAt: welcome.createdAt },
    });

    return { connection: conn, threadId: thread.id };
  });

  return NextResponse.json(updated);
}
