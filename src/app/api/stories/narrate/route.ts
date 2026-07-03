import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateStoryNarration } from "@/lib/services/story-media";
import {
  getCachedTodayStoryAudio,
  saveTodayStoryAudio,
  hashStoryText,
  getTodayBriefStory,
} from "@/lib/services/story-audio-cache";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { story, savedStoryId, cache, source } = await request.json();
  if (!story?.trim()) {
    return NextResponse.json({ error: "Story text is required" }, { status: 400 });
  }

  const trimmed = story.trim();

  if (source === "today" || cache !== false) {
    const todayStory = await getTodayBriefStory(session.user.id);
    if (todayStory && hashStoryText(todayStory) === hashStoryText(trimmed)) {
      const cached = await getCachedTodayStoryAudio(session.user.id, trimmed);
      if (cached) {
        return new NextResponse(new Uint8Array(cached), {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "private, max-age=86400",
          },
        });
      }
    }
  }

  if (savedStoryId) {
    const existing = await prisma.savedStory.findFirst({
      where: { id: savedStoryId, userId: session.user.id },
      select: { audioData: true },
    });
    if (existing?.audioData) {
      return new NextResponse(new Uint8Array(existing.audioData), {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "private, max-age=86400",
        },
      });
    }
  }

  const audioBuffer = await generateStoryNarration(trimmed);

  const todayStory = await getTodayBriefStory(session.user.id);
  if (todayStory && hashStoryText(todayStory) === hashStoryText(trimmed)) {
    await saveTodayStoryAudio(session.user.id, trimmed, audioBuffer);
  }

  if (savedStoryId && cache !== false) {
    await prisma.savedStory.updateMany({
      where: { id: savedStoryId, userId: session.user.id },
      data: { audioData: audioBuffer },
    });
  }

  return new NextResponse(new Uint8Array(audioBuffer), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
