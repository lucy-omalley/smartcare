import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateStoryIllustration } from "@/lib/services/story-media";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, story, savedStoryId, moral } = await request.json();
  if (!title?.trim() || !story?.trim()) {
    return NextResponse.json({ error: "Title and story are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { childNickname: true },
  });

  try {
    const illustrationData = await generateStoryIllustration(
      title.trim(),
      story.trim(),
      user?.childNickname,
      moral?.trim() || null
    );

    if (savedStoryId) {
      await prisma.savedStory.updateMany({
        where: { id: savedStoryId, userId: session.user.id },
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
