import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import {
  computeMatchScore,
  matchesFilters,
  type ConnectProfile,
  type MatchResult,
} from "@/lib/services/parent-matching";

const profileSelect = {
  id: true,
  name: true,
  childNickname: true,
  childAge: true,
  parentingGoal: true,
  location: true,
  bio: true,
  interests: true,
  openToConnect: true,
} as const;

function connectionStatusFor(
  userId: string,
  candidateId: string,
  connections: { id: string; requesterId: string; recipientId: string; status: string; thread: { id: string } | null }[]
): Pick<MatchResult, "connectionStatus" | "connectionId" | "threadId"> {
  const conn = connections.find(
    (c) =>
      (c.requesterId === userId && c.recipientId === candidateId) ||
      (c.requesterId === candidateId && c.recipientId === userId)
  );
  if (!conn) return { connectionStatus: "none" };
  if (conn.status === "ACCEPTED") {
    return { connectionStatus: "connected", connectionId: conn.id, threadId: conn.thread?.id };
  }
  if (conn.status === "DECLINED") return { connectionStatus: "declined", connectionId: conn.id };
  if (conn.requesterId === userId) return { connectionStatus: "pending_sent", connectionId: conn.id };
  return { connectionStatus: "pending_received", connectionId: conn.id };
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location") ?? undefined;
  const interest = searchParams.get("interest") ?? undefined;
  const childAge = searchParams.get("childAge") ?? undefined;

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: profileSelect,
  });
  if (!viewer) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const candidates = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      openToConnect: true,
      onboardingComplete: true,
    },
    select: profileSelect,
    take: 100,
  });

  const connections = await prisma.parentConnection.findMany({
    where: {
      OR: [{ requesterId: session.user.id }, { recipientId: session.user.id }],
    },
    include: { thread: { select: { id: true } } },
  });

  const viewerProfile = viewer as ConnectProfile;
  const filters = { location, interest, childAge };

  const matches: MatchResult[] = candidates
    .filter((c) => matchesFilters(c as ConnectProfile, filters))
    .map((candidate) => {
      const { score, reasons } = computeMatchScore(viewerProfile, candidate as ConnectProfile);
      return {
        profile: candidate as ConnectProfile,
        score,
        reasons,
        ...connectionStatusFor(session.user.id, candidate.id, connections),
      };
    })
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ matches, viewer: viewerProfile });
}
