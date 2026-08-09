import "server-only";

import { prisma } from "@/lib/db";
import type { ParentMoodSignals } from "../types";
import { classifyMood } from "../scoring/mood-nearby";

export const DEFAULT_MOOD: ParentMoodSignals = {
  moodBand: "neutral",
  feeling: null,
  todayWin: null,
  todayChallenge: null,
  checkedInToday: false,
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function gatherParentMoodSignals(userId: string): Promise<ParentMoodSignals> {
  const todayStart = startOfToday();
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const checkIn = await prisma.parentCheckIn.findFirst({
    where: { userId, createdAt: { gte: twoDaysAgo } },
    orderBy: { createdAt: "desc" },
  });

  if (checkIn) {
    return {
      moodBand: checkIn.moodBand as ParentMoodSignals["moodBand"],
      feeling: checkIn.feeling,
      todayWin: checkIn.win,
      todayChallenge: checkIn.challenge,
      checkedInToday: checkIn.createdAt >= todayStart,
    };
  }

  return DEFAULT_MOOD;
}

export function moodFromCheckIn(feeling: string, win?: string | null, challenge?: string | null) {
  const moodBand = classifyMood(feeling, challenge);
  return { moodBand, feeling, win: win ?? null, challenge: challenge ?? null };
}
