import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threads = await prisma.parentThread.findMany({
    where: {
      connection: {
        status: "ACCEPTED",
        OR: [{ requesterId: session.user.id }, { recipientId: session.user.id }],
      },
    },
    include: {
      connection: {
        include: {
          requester: { select: { id: true, name: true, location: true } },
          recipient: { select: { id: true, name: true, location: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const items = threads.map((t) => {
    const other =
      t.connection.requesterId === session.user!.id
        ? t.connection.recipient
        : t.connection.requester;
    const last = t.messages[0];
    return {
      id: t.id,
      other,
      lastMessage: last
        ? {
            content: last.content,
            createdAt: last.createdAt,
            isMine: last.senderId === session.user!.id,
          }
        : null,
      updatedAt: t.updatedAt,
    };
  });

  return NextResponse.json({ threads: items });
}
