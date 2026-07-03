import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await prisma.connectEvent.findMany({
    where: {
      status: { in: ["published", "full"] },
      date: { gte: today },
    },
    include: {
      organiser: { select: { id: true, name: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { date: "asc" },
    take: 50,
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      broadArea: e.broadArea,
      date: e.date,
      timeWindow: e.timeWindow,
      activityType: e.activityType,
      childAgeRange: e.childAgeRange,
      maxParticipants: e.maxParticipants,
      description: e.description,
      joinApprovalType: e.joinApprovalType,
      status: e.status,
      organiserFirstName: e.organiser.name.split(" ")[0],
      organiserId: e.organiserId,
      participantCount: e._count.participants,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    broadArea,
    exactLocation,
    date,
    timeWindow,
    activityType,
    childAgeRange,
    maxParticipants,
    description,
    visibility,
    joinApprovalType,
  } = body;

  if (!title?.trim() || !broadArea?.trim() || !date || !timeWindow || !activityType || !childAgeRange) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const event = await prisma.connectEvent.create({
    data: {
      organiserId: session.user.id,
      title: title.trim(),
      broadArea: broadArea.trim(),
      exactLocation: exactLocation?.trim() || null,
      date: new Date(date),
      timeWindow,
      activityType,
      childAgeRange,
      maxParticipants: maxParticipants ? Number(maxParticipants) : null,
      description: description?.trim() || null,
      visibility: visibility ?? "public",
      joinApprovalType: joinApprovalType ?? "auto",
      status: "published",
    },
  });

  return NextResponse.json({ event });
}
