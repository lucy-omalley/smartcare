import { NextResponse } from "next/server";
import { requireAiSession } from "@/lib/auth/session-guards";
import { recordStoryPlay } from "@/lib/services/family-story-library";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";
import type { NarratorType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await request.json();
  const {
    voiceProfileId,
    narratorType,
    listenedSeconds,
    completed,
  } = body as {
    voiceProfileId?: string | null;
    narratorType?: NarratorType;
    listenedSeconds?: number;
    completed?: boolean;
  };

  await recordStoryPlay({
    userId: guard.userId,
    storyId: params.id,
    voiceProfileId,
    narratorType: narratorType ?? (voiceProfileId ? "FAMILY_VOICE" : "STANDARD"),
    listenedSeconds,
    completed,
  });

  await persistAnalyticsEvent(completed ? "family_story_completed" : "family_story_played", guard.userId, {
    storyId: params.id,
    narratorType: narratorType ?? "STANDARD",
    voiceProfileId,
    listenedSeconds,
  });

  return NextResponse.json({ ok: true });
}
