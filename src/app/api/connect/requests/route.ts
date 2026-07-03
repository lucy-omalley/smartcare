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

  const requests = await prisma.connectRequest.findMany({
    where: {
      OR: [{ requesterId: userId }, { recipientId: userId }],
    },
    include: {
      requester: { select: { id: true, name: true } },
      recipient: { select: { id: true, name: true } },
      parentStatus: true,
      event: { select: { id: true, title: true, broadArea: true, date: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      requestType: r.requestType,
      status: r.status,
      isIncoming: r.recipientId === userId,
      otherParentName: (r.recipientId === userId ? r.requester.name : r.recipient.name).split(" ")[0],
      parentStatus: r.parentStatus,
      event: r.event,
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { statusId } = await request.json();

  if (!statusId) {
    return NextResponse.json({ error: "statusId required" }, { status: 400 });
  }

  const parentStatus = await prisma.parentStatus.findUnique({
    where: { id: statusId },
  });

  if (!parentStatus || !parentStatus.isOpen) {
    return NextResponse.json({ error: "Status not available" }, { status: 404 });
  }

  if (parentStatus.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot connect with yourself" }, { status: 400 });
  }

  const existing = await prisma.connectRequest.findFirst({
    where: {
      statusId,
      requesterId: session.user.id,
      requestType: "STATUS_INTEREST",
    },
  });

  if (existing) {
    return NextResponse.json({ request: existing });
  }

  const connectRequest = await prisma.connectRequest.create({
    data: {
      requesterId: session.user.id,
      recipientId: parentStatus.userId,
      statusId,
      requestType: "STATUS_INTEREST",
      status: "PENDING",
    },
  });

  return NextResponse.json({ request: connectRequest });
}
