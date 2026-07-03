import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const [statuses, myStatus] = await Promise.all([
    prisma.parentStatus.findMany({
      where: {
        isOpen: true,
        expiresAt: { gt: now },
        userId: { not: session.user.id },
      },
      include: {
        user: { select: { id: true, name: true, broadArea: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.parentStatus.findFirst({
      where: {
        userId: session.user.id,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    statuses: statuses.map((s) => ({
      id: s.id,
      parentFirstName: s.user.name.split(" ")[0],
      broadArea: s.broadArea,
      timeWindow: s.timeWindow,
      interest: s.interest,
      childAgeRange: s.childAgeRange,
      note: s.note,
      isOpen: s.isOpen,
      userId: s.userId,
    })),
    myStatus,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { broadArea, timeWindow, interest, childAgeRange, note, isOpen } = body;

  if (!broadArea?.trim() || !timeWindow || !interest || !childAgeRange) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // TODO: Add cron job to auto-expire statuses at end of day if not handled by expiresAt filter
  const expiresAt = endOfToday();

  await prisma.parentStatus.deleteMany({
    where: { userId: session.user.id, expiresAt: { gt: new Date() } },
  });

  const status = await prisma.parentStatus.create({
    data: {
      userId: session.user.id,
      broadArea: broadArea.trim(),
      timeWindow,
      interest,
      childAgeRange,
      note: note?.trim() || null,
      isOpen: isOpen ?? true,
      expiresAt,
    },
  });

  return NextResponse.json({ status });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.parentStatus.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
