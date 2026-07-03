import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { regenerateDailyBriefSection } from "@/lib/services/daily-brief";
import { warmTodayStoryAudio } from "@/lib/services/story-audio-cache";

export const maxDuration = 60;

const SECTIONS = new Set(["recipe", "play", "story", "language"]);

/** Fast Try another — regenerates one Today plan section only. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { section } = (await request.json()) as { section?: string };
    if (!section || !SECTIONS.has(section)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    const brief = await regenerateDailyBriefSection(
      session.user.id,
      section as "recipe" | "play" | "story" | "language"
    );

    if (section === "story") {
      warmTodayStoryAudio(session.user.id);
    }

    return NextResponse.json({ brief, section });
  } catch (error) {
    console.error("Today rotate error:", error);
    const message = error instanceof Error ? error.message : "Rotate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
