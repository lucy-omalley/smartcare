import "server-only";

import type { BriefProfile } from "@/lib/daily-brief-context";
import type { PlanContext } from "@/lib/knowledge/repository";
import type { AIMemorySignals } from "@/lib/services/today-recommendation-engine";
import type { PlanHistory, PlanSignals } from "../types";
import { buildPlanSignals } from "./build-plan-signals";
import { gatherNearbyEventSignals } from "./gather-nearby-events";
import { gatherParentMoodSignals } from "./gather-parent-mood";

export async function buildPlanSignalsForUser(params: {
  userId: string;
  profile: BriefProfile;
  ctx: PlanContext;
  memory: AIMemorySignals;
  date?: Date;
  history?: PlanHistory;
}): Promise<PlanSignals> {
  const [mood, nearby] = await Promise.all([
    gatherParentMoodSignals(params.userId),
    gatherNearbyEventSignals(params.userId, params.profile),
  ]);

  return buildPlanSignals(
    params.profile,
    params.ctx,
    params.memory,
    params.date,
    params.history,
    { mood, nearby }
  );
}
