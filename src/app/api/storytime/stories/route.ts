import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { requireAiSession } from "@/lib/auth/session-guards";
import { generateFamilyStory } from "@/lib/services/family-story-generator";
import { listFamilyStories } from "@/lib/services/family-story-library";
import {
  assertCanGenerateFamilyStory,
  assertStoryLengthAllowed,
} from "@/lib/storytime/gating";
import type { BedtimeMood, StoryCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";
import { AiDisabledError, EmailNotVerifiedError } from "@/lib/ai/guards";
import { mapAiRouteError } from "@/lib/ai/route-errors";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const category = (searchParams.get("category") as StoryCategory | null) ?? undefined;
  const favorite = searchParams.get("favorite") === "1";

  const stories = await listFamilyStories(session.user.id, { q, category, favorite });
  return NextResponse.json({ stories });
}

export async function POST(request: Request) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await request.json();
  const {
    category,
    lengthMinutes,
    bedtimeMood,
    moralTheme,
    learningGoal,
    childName,
    childAge,
    favouriteAnimal,
    favouriteVehicle,
    favouriteCharacter,
    interests,
  } = body as {
    category?: StoryCategory;
    lengthMinutes?: number;
    bedtimeMood?: BedtimeMood;
    moralTheme?: string;
    learningGoal?: string;
    childName?: string;
    childAge?: string;
    favouriteAnimal?: string;
    favouriteVehicle?: string;
    favouriteCharacter?: string;
    interests?: string[];
  };

  if (!category || !lengthMinutes) {
    return NextResponse.json({ error: "Category and length are required." }, { status: 400 });
  }

  try {
    const features = await assertCanGenerateFamilyStory(guard.userId);
    assertStoryLengthAllowed(lengthMinutes, features);

    const user = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: {
        childNickname: true,
        childAge: true,
        childInterests: true,
        favouriteAnimal: true,
        favouriteVehicle: true,
        favouriteCharacter: true,
        storyLearningTheme: true,
        storyMoralPreference: true,
      },
    });

    const story = await generateFamilyStory({
      userId: guard.userId,
      childName: childName?.trim() || user?.childNickname || "little one",
      childAge: childAge ?? user?.childAge,
      category,
      lengthMinutes,
      bedtimeMood,
      moralTheme: moralTheme ?? user?.storyMoralPreference ?? undefined,
      learningGoal: learningGoal ?? user?.storyLearningTheme ?? undefined,
      favouriteAnimal: favouriteAnimal ?? user?.favouriteAnimal ?? undefined,
      favouriteVehicle: favouriteVehicle ?? user?.favouriteVehicle ?? undefined,
      favouriteCharacter: favouriteCharacter ?? user?.favouriteCharacter ?? undefined,
      interests: interests ?? user?.childInterests ?? [],
    });

    await persistAnalyticsEvent("family_story_generated", guard.userId, {
      category,
      lengthMinutes,
      storyId: story.id,
      usedFallback: Boolean((story as { usedFallback?: boolean }).usedFallback),
    });

    const { usedFallback, ...saved } = story as typeof story & { usedFallback?: boolean };
    return NextResponse.json({ story: saved, usedFallback: usedFallback ?? false });
  } catch (error) {
    if (error instanceof EmailNotVerifiedError) {
      return NextResponse.json({ error: error.message, code: "EMAIL_NOT_VERIFIED" }, { status: 403 });
    }
    if (error instanceof AiDisabledError) {
      return NextResponse.json({ error: error.message, code: "AI_DISABLED" }, { status: 503 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return NextResponse.json(
        {
          error: "Story storage is not ready yet. Please try again in a few minutes or contact support.",
          code: "DB_NOT_READY",
        },
        { status: 503 }
      );
    }
    console.error("Family story generation error:", error);
    if (error instanceof Error && /Story generation failed|invalid format|missing title/.test(error.message)) {
      return NextResponse.json({ error: error.message, code: "STORY_PARSE" }, { status: 400 });
    }
    const mapped = mapAiRouteError(error);
    return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}
