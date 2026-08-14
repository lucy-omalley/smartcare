import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  getNarratorPreference,
  saveNarratorPreference,
} from "@/lib/services/voice-profile-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getNarratorPreference(session.user.id);
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const selection = body.selection as
    | { type: "standard" }
    | { type: "family"; voiceProfileId: string };

  if (!selection?.type) {
    return NextResponse.json({ error: "Invalid selection" }, { status: 400 });
  }

  await saveNarratorPreference(session.user.id, selection);
  const settings = await getNarratorPreference(session.user.id);
  return NextResponse.json({ settings });
}
