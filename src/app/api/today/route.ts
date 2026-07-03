import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getTodayPageData } from "@/lib/services/today-page";
import { warmTodayStoryAudio } from "@/lib/services/story-audio-cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Fast Today dashboard payload — brief + profile only. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { brief, profile } = await getTodayPageData(session.user.id);
    warmTodayStoryAudio(session.user.id);
    return NextResponse.json({ brief, profile });
  } catch (error) {
    console.error("Today GET error:", error);
    const message = error instanceof Error ? error.message : "Failed to load today";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
