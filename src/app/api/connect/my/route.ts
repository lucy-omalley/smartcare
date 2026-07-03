import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [myStatus, myEvents, joinedEvents, sentRequests, receivedRequests] = await Promise.all([
    prisma.parentStatus.findFirst({
      where: { userId, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.connectEvent.findMany({
      where: { organiserId: userId, date: { gte: today } },
      orderBy: { date: "asc" },
    }),
    prisma.eventParticipant.findMany({
      where: { userId, status: "JOINED" },
      include: {
        event: true,
      },
    }),
    prisma.connectRequest.findMany({
      where: { requesterId: userId },
      include: {
        recipient: { select: { name: true } },
        parentStatus: true,
        event: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.connectRequest.findMany({
      where: { recipientId: userId },
      include: {
        requester: { select: { name: true } },
        parentStatus: true,
        event: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    myStatus,
    myEvents,
    joinedEvents: joinedEvents.map((j) => j.event),
    sentRequests,
    receivedRequests,
  });
}
