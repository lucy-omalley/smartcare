import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getOrGenerateTodayStoryAudio } from "@/lib/services/story-audio-cache";

export const maxDuration = 60;

/** Cached narration for today's brief story — instant on repeat listens. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const audioBuffer = await getOrGenerateTodayStoryAudio(session.user.id);
    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Today story audio GET error:", error);
    const message = error instanceof Error ? error.message : "Narration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Prefetch/warm cache without waiting for the client to tap Listen. */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await getOrGenerateTodayStoryAudio(session.user.id);
    return NextResponse.json({ ok: true, cached: true });
  } catch (error) {
    console.error("Today story audio warm error:", error);
    const message = error instanceof Error ? error.message : "Warm failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
