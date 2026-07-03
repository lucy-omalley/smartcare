import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await prisma.connectEvent.findUnique({
    where: { id: params.id },
    include: { _count: { select: { participants: true } } },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.organiserId === session.user.id) {
    return NextResponse.json({ error: "Cannot join your own event" }, { status: 400 });
  }

  if (event.maxParticipants && event._count.participants >= event.maxParticipants) {
    await prisma.connectEvent.update({
      where: { id: event.id },
      data: { status: "full" },
    });
    return NextResponse.json({ error: "Event is full" }, { status: 400 });
  }

  const existing = await prisma.eventParticipant.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: session.user.id } },
  });

  if (existing) {
    return NextResponse.json({ participant: existing });
  }

  if (event.joinApprovalType === "request") {
    const existingRequest = await prisma.connectRequest.findFirst({
      where: {
        eventId: event.id,
        requesterId: session.user.id,
        requestType: "EVENT_JOIN",
      },
    });

    if (existingRequest) {
      return NextResponse.json({ request: existingRequest });
    }

    const connectRequest = await prisma.connectRequest.create({
      data: {
        requesterId: session.user.id,
        recipientId: event.organiserId,
        eventId: event.id,
        requestType: "EVENT_JOIN",
        status: "PENDING",
      },
    });

    return NextResponse.json({ request: connectRequest, pending: true });
  }

  const participant = await prisma.eventParticipant.create({
    data: {
      eventId: event.id,
      userId: session.user.id,
      status: "JOINED",
    },
  });

  return NextResponse.json({ participant, joined: true });
}
