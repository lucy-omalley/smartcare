import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meetup = await prisma.meetup.findUnique({
    where: { id: params.id },
    include: { _count: { select: { attendees: true } } },
  });

  if (!meetup) {
    return NextResponse.json({ error: "Meetup not found" }, { status: 404 });
  }

  if (meetup._count.attendees >= meetup.maxAttendees) {
    return NextResponse.json({ error: "Meetup is full" }, { status: 400 });
  }

  const existing = await prisma.meetupAttendee.findUnique({
    where: { meetupId_userId: { meetupId: params.id, userId: session.user.id } },
  });

  if (existing) {
    return NextResponse.json({ message: "Already joined" });
  }

  await prisma.meetupAttendee.create({
    data: { meetupId: params.id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
