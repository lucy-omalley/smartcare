import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { requireAiSession } from "@/lib/auth/session-guards";
import { deleteVoiceProfile } from "@/lib/services/voice-profile-service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.voiceProfile.findFirst({
    where: { id: params.id, userId: session.user.id, deletedAt: null },
    select: {
      id: true,
      name: true,
      relationship: true,
      avatarEmoji: true,
      status: true,
      recordingCount: true,
      consentGivenAt: true,
      createdAt: true,
      processingError: true,
    },
  });

  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    await deleteVoiceProfile(guard.userId, params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
