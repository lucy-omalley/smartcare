import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await request.json();
  const connectRequest = await prisma.connectRequest.findUnique({
    where: { id: params.id },
    include: { event: true },
  });

  if (!connectRequest || connectRequest.recipientId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "accept") {
    const updated = await prisma.connectRequest.update({
      where: { id: params.id },
      data: { status: "ACCEPTED" },
    });

    if (connectRequest.requestType === "EVENT_JOIN" && connectRequest.eventId) {
      await prisma.eventParticipant.upsert({
        where: {
          eventId_userId: {
            eventId: connectRequest.eventId,
            userId: connectRequest.requesterId,
          },
        },
        create: {
          eventId: connectRequest.eventId,
          userId: connectRequest.requesterId,
          status: "JOINED",
        },
        update: { status: "JOINED" },
      });
    }

    return NextResponse.json({ request: updated });
  }

  if (action === "decline") {
    const updated = await prisma.connectRequest.update({
      where: { id: params.id },
      data: { status: "DECLINED" },
    });
    return NextResponse.json({ request: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
