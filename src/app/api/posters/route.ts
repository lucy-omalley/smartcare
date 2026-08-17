import { NextResponse } from "next/server";
import { requireAiSession, aiGuardErrorResponse } from "@/lib/auth/session-guards";
import { mapAiRouteError } from "@/lib/ai/route-errors";
import {
  createAdventureFromTemplate,
  generateAdventureJourney,
  listAdventureJourneys,
} from "@/lib/services/adventure-generator";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";
import type { GenerateAdventureInput } from "@/types/adventure-journey";
import type {
  AdventureFormat,
  PosterParentGoal,
  PosterTheme,
  RoutineChallenge,
  RoutineLength,
  RoutineTemplateType,
  StoryTheme,
} from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  const posters = await listAdventureJourneys(guard.userId);
  return NextResponse.json({ posters });
}

export async function POST(request: Request) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  try {
    const body = await request.json();
    const input: GenerateAdventureInput = {
      userId: guard.userId,
      templateType: body.templateType as RoutineTemplateType,
      childName: String(body.childName ?? "").trim(),
      childAge: body.childAge ?? null,
      childGender: body.childGender ?? null,
      numberOfChildren: typeof body.numberOfChildren === "number" ? body.numberOfChildren : 1,
      interests: Array.isArray(body.interests) ? body.interests.map(String) : [],
      theme: (body.theme as PosterTheme) ?? "DINOSAUR",
      storyTheme: (body.storyTheme as StoryTheme) ?? "ADVENTURE",
      adventureFormat: (body.adventureFormat as AdventureFormat) ?? "STORY_BOOK",
      favouriteColours: Array.isArray(body.favouriteColours) ? body.favouriteColours.map(String) : [],
      challenge: body.challenge as RoutineChallenge,
      length: (body.length as RoutineLength) ?? "MEDIUM",
      parentGoals: Array.isArray(body.parentGoals) ? (body.parentGoals as PosterParentGoal[]) : [],
      category: body.category,
      layout: body.layout,
    };

    if (!input.childName) {
      return NextResponse.json({ error: "Child name is required." }, { status: 400 });
    }

    const useAi = body.useAi !== false;
    const poster = useAi
      ? await generateAdventureJourney(input)
      : await createAdventureFromTemplate(input);

    const pageCount = poster.pages?.length ?? poster.steps?.length ?? 0;

    await persistAnalyticsEvent("adventure_generated", guard.userId, {
      templateType: input.templateType,
      theme: input.theme,
      storyTheme: input.storyTheme,
      adventureFormat: input.adventureFormat,
      useAi,
      pageCount,
    });
    await persistAnalyticsEvent("poster_created", guard.userId, {
      templateType: input.templateType,
      theme: input.theme,
      useAi,
      stepCount: pageCount,
    });

    return NextResponse.json({ poster });
  } catch (error) {
    const mapped = mapAiRouteError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
