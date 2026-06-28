import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stories = await prisma.savedStory.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      story: true,
      moral: true,
      illustrationData: true,
      createdAt: true,
      audioData: true,
    },
  });

  const storiesWithAudio = stories.map(({ audioData, ...rest }) => ({
    ...rest,
    hasAudio: !!audioData,
  }));

  return NextResponse.json({ stories: storiesWithAudio });
}
