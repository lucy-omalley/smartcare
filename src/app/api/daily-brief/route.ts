import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import {
  getOrCreateDailyBrief,
  regenerateDailyBriefSection,
  getHomeSupplementaryData,
  generateAndSaveBriefIllustrations,
  needsBriefIllustrations,
} from "@/lib/services/daily-brief";
import type { DailyBriefContent } from "@/types/daily-brief";
import type { IllustrationSection } from "@/lib/services/card-illustrations";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ILLUSTRATION_SECTIONS: IllustrationSection[] = ["recipe", "play", "story", "development", "tip"];

function parseIllustrationSections(sections: unknown): IllustrationSection[] | undefined {
  if (!Array.isArray(sections)) return undefined;
  const valid = sections.filter((s): s is IllustrationSection =>
    ILLUSTRATION_SECTIONS.includes(s as IllustrationSection)
  );
  return valid.length ? valid : undefined;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const supplementary = await getHomeSupplementaryData(userId);

    let brief: DailyBriefContent;
    try {
      brief = await getOrCreateDailyBrief(userId);
    } catch (error) {
      console.error("Daily brief GET error:", error);
      const message = error instanceof Error ? error.message : "Failed to load daily brief";
      return NextResponse.json({ error: message, ...supplementary }, { status: 500 });
    }

    return NextResponse.json({
      brief,
      needsIllustrations: needsBriefIllustrations(brief),
      ...supplementary,
    });
  } catch (error) {
    console.error("Home data GET error:", error);
    const message = error instanceof Error ? error.message : "Failed to load home data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body as { action: string; illustrationData?: string };

    if (action === "generate-illustrations") {
      const sections = parseIllustrationSections((body as { sections?: unknown }).sections);
      const brief = await generateAndSaveBriefIllustrations(session.user.id, sections);
      return NextResponse.json({ brief, needsIllustrations: needsBriefIllustrations(brief) });
    }

    if (action === "regenerate-recipe") {
      const brief = await regenerateDailyBriefSection(session.user.id, "recipe");
      return NextResponse.json({ brief });
    }

    if (action === "regenerate-play") {
      const brief = await regenerateDailyBriefSection(session.user.id, "play");
      return NextResponse.json({ brief });
    }

    if (action === "save-recipe") {
      const brief = await getOrCreateDailyBrief(session.user.id);
      const recipe = brief.recipe;
      const saved = await prisma.savedRecipe.create({
        data: {
          userId: session.user.id,
          title: recipe.subtitle,
          content: recipe as object,
        },
      });
      return NextResponse.json({ saved, brief });
    }

    if (action === "save-story") {
      const brief = await getOrCreateDailyBrief(session.user.id);
      const story = brief.bedtimeStory;
      const illustrationData = (body as { illustrationData?: string }).illustrationData;
      const saved = await prisma.savedStory.create({
        data: {
          userId: session.user.id,
          title: story.title,
          story: story.story,
          moral: story.moral ?? null,
          illustrationData: illustrationData ?? story.illustrationData ?? null,
        },
      });
      return NextResponse.json({ saved, brief });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Daily brief PATCH error:", error);
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export type HomeBriefResponse = {
  brief: DailyBriefContent;
  meetups: Awaited<ReturnType<typeof getHomeSupplementaryData>>["meetups"];
  weekendActivities: Awaited<ReturnType<typeof getHomeSupplementaryData>>["weekendActivities"];
  profile: Awaited<ReturnType<typeof getHomeSupplementaryData>>["profile"];
  yesterdayMemory: Awaited<ReturnType<typeof getHomeSupplementaryData>>["yesterdayMemory"];
};
