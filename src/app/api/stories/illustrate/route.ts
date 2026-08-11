import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateStoryIllustration } from "@/lib/services/story-media";
import { aiGuardErrorResponse, requireAiSession } from "@/lib/auth/session-guards";

export async function POST(request: Request) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  const { title, story, savedStoryId, moral } = await request.json();
  if (!title?.trim() || !story?.trim()) {
    return NextResponse.json({ error: "Title and story are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: guard.userId },
    select: { childNickname: true },
  });

  try {
    const illustrationData = await generateStoryIllustration(
      title.trim(),
      story.trim(),
      user?.childNickname,
      moral?.trim() || null,
      true
    );

    if (savedStoryId) {
      await prisma.savedStory.updateMany({
        where: { id: savedStoryId, userId: guard.userId },
        data: { illustrationData },
      });
    }

    return NextResponse.json({ illustrationData });
  } catch (error) {
    console.error("Story illustration error:", error);
    const message = error instanceof Error ? error.message : "Illustration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
