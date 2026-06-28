import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  const meetups = await prisma.meetup.findMany({
    where: { date: { gte: new Date() } },
    orderBy: { date: "asc" },
    include: {
      user: { select: { name: true } },
      attendees: { select: { userId: true } },
      _count: { select: { attendees: true } },
    },
    take: 50,
  });

  return NextResponse.json({ meetups });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, date, time, location, childAgeRange, maxAttendees } = await request.json();

  if (!title?.trim() || !date || !time || !location?.trim()) {
    return NextResponse.json({ error: "Title, date, time, and location are required" }, { status: 400 });
  }

  const meetup = await prisma.meetup.create({
    data: {
      userId: session.user.id,
      title: title.trim(),
      date: new Date(date),
      time: time.trim(),
      location: location.trim(),
      childAgeRange: childAgeRange?.trim() || "All ages",
      maxAttendees: maxAttendees || 10,
    },
  });

  return NextResponse.json({ meetup });
}
