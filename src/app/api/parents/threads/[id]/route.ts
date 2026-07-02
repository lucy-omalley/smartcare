import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

async function getThreadForUser(threadId: string, userId: string) {
  return prisma.parentThread.findFirst({
    where: {
      id: threadId,
      connection: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { recipientId: userId }],
      },
    },
    include: {
      connection: {
        include: {
          requester: { select: { id: true, name: true } },
          recipient: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thread = await getThreadForUser(params.id, session.user.id);
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await prisma.parentMessage.findMany({
    where: { threadId: params.id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true } } },
  });

  const { connection } = thread;
  const other =
    connection.requesterId === session.user.id ? connection.recipient : connection.requester;

  return NextResponse.json({ thread: { id: thread.id, other }, messages });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await request.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const thread = await getThreadForUser(params.id, session.user.id);
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.parentMessage.create({
      data: {
        threadId: params.id,
        senderId: session.user.id,
        content: content.trim(),
      },
      include: { sender: { select: { id: true, name: true } } },
    });
    await tx.parentThread.update({
      where: { id: params.id },
      data: { updatedAt: msg.createdAt },
    });
    return msg;
  });

  return NextResponse.json({ message });
}
