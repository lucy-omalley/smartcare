import "server-only";

import { prisma } from "@/lib/db";
import type { BriefProfile } from "@/lib/daily-brief-context";
import type { NearbyEventSignals } from "../types";
import { normalizeTokens } from "../scoring/utils";

export const DEFAULT_NEARBY: NearbyEventSignals = {
  broadArea: null,
  eventTokens: [],
  hasSocialOpportunity: false,
  parentsAvailableToday: 0,
  upcomingCount: 0,
  highlightEvent: null,
};

function matchesBroadArea(value: string, broadArea: string | null | undefined): boolean {
  if (!broadArea?.trim()) return true;
  const area = broadArea.trim().toLowerCase();
  const hay = value.toLowerCase();
  return hay.includes(area) || area.includes(hay.slice(0, Math.min(hay.length, 24)));
}

function collectTokens(...parts: Array<string | null | undefined>): string[] {
  return normalizeTokens(
    parts.flatMap((p) => (p ? p.split(/[\s,/&]+/) : [])).filter((t) => t.length >= 3)
  );
}

export async function gatherNearbyEventSignals(
  userId: string,
  profile: BriefProfile
): Promise<NearbyEventSignals> {
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const broadArea = profile.broadArea ?? null;

  const [meetups, activities, connectEvents, parentsAvailableToday] = await Promise.all([
    prisma.meetup.findMany({
      where: { date: { gte: now, lte: weekAhead } },
      orderBy: { date: "asc" },
      take: 8,
      select: { title: true, date: true, location: true, childAgeRange: true },
    }),
    prisma.activity.findMany({
      where: { date: { gte: now, lte: weekAhead } },
      orderBy: { date: "asc" },
      take: 8,
      select: { title: true, description: true, category: true, date: true, location: true },
    }),
    prisma.connectEvent.findMany({
      where: {
        status: { in: ["published", "full"] },
        date: { gte: now, lte: weekAhead },
      },
      orderBy: { date: "asc" },
      take: 8,
      select: {
        title: true,
        broadArea: true,
        activityType: true,
        date: true,
        timeWindow: true,
      },
    }),
    prisma.parentStatus.count({
      where: {
        isOpen: true,
        expiresAt: { gt: now },
        ...(broadArea
          ? { broadArea: { contains: broadArea, mode: "insensitive" as const } }
          : {}),
      },
    }),
  ]);

  const filteredMeetups = meetups.filter((m) => matchesBroadArea(m.location, broadArea));
  const filteredActivities = activities.filter((a) => matchesBroadArea(a.location, broadArea));
  const filteredConnect = connectEvents.filter((e) => matchesBroadArea(e.broadArea, broadArea));

  const eventTokens = [
    ...collectTokens(...filteredMeetups.map((m) => m.title)),
    ...collectTokens(...filteredActivities.map((a) => `${a.title} ${a.category} ${a.description}`)),
    ...collectTokens(...filteredConnect.map((e) => `${e.title} ${e.activityType}`)),
  ];

  const uniqueTokens = Array.from(new Set(eventTokens)).slice(0, 24);
  const upcomingCount = filteredMeetups.length + filteredActivities.length + filteredConnect.length;
  const highlight =
    filteredConnect[0] ??
    (filteredMeetups[0]
      ? {
          title: filteredMeetups[0].title,
          broadArea: broadArea ?? filteredMeetups[0].location,
          activityType: "meetup",
          date: filteredMeetups[0].date,
        }
      : filteredActivities[0]
        ? {
            title: filteredActivities[0].title,
            broadArea: broadArea ?? filteredActivities[0].location,
            activityType: filteredActivities[0].category.toLowerCase(),
            date: filteredActivities[0].date,
          }
        : null);

  void userId;

  return {
    broadArea,
    eventTokens: uniqueTokens,
    hasSocialOpportunity: upcomingCount > 0 || parentsAvailableToday > 0,
    parentsAvailableToday,
    upcomingCount,
    highlightEvent: highlight
      ? {
          title: highlight.title,
          broadArea: "broadArea" in highlight ? highlight.broadArea : broadArea ?? "",
          activityType: highlight.activityType,
          date: highlight.date,
        }
      : null,
  };
}
