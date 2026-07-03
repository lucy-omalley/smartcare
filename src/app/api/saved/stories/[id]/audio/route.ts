import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateStoryNarration } from "@/lib/services/story-media";

export const maxDuration = 60;

const inflight = new Map<string, Promise<Buffer>>();

async function getOrGenerateSavedStoryAudio(
  userId: string,
  storyId: string,
  storyText: string,
  existing: Buffer | null
): Promise<Buffer> {
  if (existing) return existing;

  const key = `${userId}:${storyId}`;
  const pending = inflight.get(key);
  if (pending) return pending;

  const task = (async () => {
    const row = await prisma.savedStory.findFirst({
      where: { id: storyId, userId },
      select: { audioData: true },
    });
    if (row?.audioData) return Buffer.from(row.audioData);

    const audioBuffer = await generateStoryNarration(storyText);
    await prisma.savedStory.updateMany({
      where: { id: storyId, userId },
      data: { audioData: audioBuffer },
    });
    return audioBuffer;
  })();

  inflight.set(key, task);
  try {
    return await task;
  } finally {
    inflight.delete(key);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const story = await prisma.savedStory.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { story: true, audioData: true },
  });

  if (!story) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const existing = story.audioData ? Buffer.from(story.audioData) : null;
    const audioBuffer = await getOrGenerateSavedStoryAudio(
      session.user.id,
      params.id,
      story.story,
      existing
    );

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Saved story audio error:", error);
    return NextResponse.json({ error: "Audio failed" }, { status: 500 });
  }
}

/** Warm narration cache without playing. */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const story = await prisma.savedStory.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { story: true, audioData: true },
  });

  if (!story) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await getOrGenerateSavedStoryAudio(
      session.user.id,
      params.id,
      story.story,
      story.audioData ? Buffer.from(story.audioData) : null
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Warm failed" }, { status: 500 });
  }
}
