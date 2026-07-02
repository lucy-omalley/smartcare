import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.parentConnection.findMany({
    where: {
      OR: [{ requesterId: session.user.id }, { recipientId: session.user.id }],
    },
    include: {
      requester: {
        select: { id: true, name: true, location: true, childAge: true, parentingGoal: true },
      },
      recipient: {
        select: { id: true, name: true, location: true, childAge: true, parentingGoal: true },
      },
      thread: { select: { id: true, updatedAt: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const items = connections.map((c) => {
    const isRequester = c.requesterId === session.user!.id;
    const other = isRequester ? c.recipient : c.requester;
    return {
      id: c.id,
      status: c.status,
      introMessage: c.introMessage,
      isRequester,
      other,
      threadId: c.thread?.id ?? null,
      createdAt: c.createdAt,
      updatedAt: c.thread?.updatedAt ?? c.updatedAt,
    };
  });

  const pendingReceived = items.filter((i) => i.status === "PENDING" && !i.isRequester);
  const pendingSent = items.filter((i) => i.status === "PENDING" && i.isRequester);
  const connected = items.filter((i) => i.status === "ACCEPTED");

  return NextResponse.json({ connections: items, pendingReceived, pendingSent, connected });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recipientId, introMessage } = await request.json();
  if (!recipientId || recipientId === session.user.id) {
    return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
  }

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, openToConnect: true },
  });
  if (!recipient?.openToConnect) {
    return NextResponse.json({ error: "Parent is not open to connect" }, { status: 400 });
  }

  const existing = await prisma.parentConnection.findFirst({
    where: {
      OR: [
        { requesterId: session.user.id, recipientId },
        { requesterId: recipientId, recipientId: session.user.id },
      ],
    },
  });
  if (existing) {
    return NextResponse.json({ error: "Connection already exists", connectionId: existing.id }, { status: 409 });
  }

  const connection = await prisma.parentConnection.create({
    data: {
      requesterId: session.user.id,
      recipientId,
      introMessage: introMessage?.trim() || null,
    },
  });

  return NextResponse.json({ connection });
}
