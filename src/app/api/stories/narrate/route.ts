import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateStoryNarration } from "@/lib/services/story-media";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { story, savedStoryId, cache } = await request.json();
  if (!story?.trim()) {
    return NextResponse.json({ error: "Story text is required" }, { status: 400 });
  }

  if (savedStoryId) {
    const existing = await prisma.savedStory.findFirst({
      where: { id: savedStoryId, userId: session.user.id },
      select: { audioData: true },
    });
    if (existing?.audioData) {
      return new NextResponse(existing.audioData, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "private, max-age=86400",
        },
      });
    }
  }

  const audioBuffer = await generateStoryNarration(story.trim());

  if (savedStoryId && cache !== false) {
    await prisma.savedStory.updateMany({
      where: { id: savedStoryId, userId: session.user.id },
      data: { audioData: audioBuffer },
    });
  }

  return new NextResponse(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
