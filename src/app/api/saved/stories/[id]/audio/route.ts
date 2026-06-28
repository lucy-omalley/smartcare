import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateStoryNarration } from "@/lib/services/story-media";

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

  let audioBuffer: Buffer;
  if (story.audioData) {
    audioBuffer = Buffer.from(story.audioData);
  } else {
    audioBuffer = await generateStoryNarration(story.story);
    await prisma.savedStory.updateMany({
      where: { id: params.id, userId: session.user.id },
      data: { audioData: audioBuffer },
    });
  }

  return new NextResponse(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
