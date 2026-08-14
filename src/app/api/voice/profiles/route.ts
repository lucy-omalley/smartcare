import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { requireAiSession } from "@/lib/auth/session-guards";
import {
  createVoiceProfile,
  listVoiceProfiles,
} from "@/lib/services/voice-profile-service";
import type { VoiceRelationship } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await listVoiceProfiles(session.user.id);
  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await request.json();
  const { name, relationship, avatarEmoji, consentGiven } = body as {
    name?: string;
    relationship?: VoiceRelationship;
    avatarEmoji?: string;
    consentGiven?: boolean;
  };

  if (!name?.trim() || !relationship) {
    return NextResponse.json({ error: "Name and relationship are required." }, { status: 400 });
  }

  try {
    const profile = await createVoiceProfile({
      userId: guard.userId,
      name,
      relationship,
      avatarEmoji,
      consentGiven: Boolean(consentGiven),
    });
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create voice profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
