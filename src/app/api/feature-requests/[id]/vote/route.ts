import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const featureId = params.id;

  const existing = await prisma.featureRequestVote.findUnique({
    where: {
      userId_featureRequestId: {
        userId: session.user.id,
        featureRequestId: featureId,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ ok: true, alreadyVoted: true });
  }

  await prisma.$transaction([
    prisma.featureRequestVote.create({
      data: { userId: session.user.id, featureRequestId: featureId },
    }),
    prisma.featureRequest.update({
      where: { id: featureId },
      data: { voteCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
