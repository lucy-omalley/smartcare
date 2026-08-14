import "server-only";

import { prisma } from "@/lib/db";
import { subDays } from "date-fns";

export async function getStorytimeFounderMetrics() {
  const since = subDays(new Date(), 30);

  const [
    totalStories,
    totalVoiceProfiles,
    readyVoiceProfiles,
    playSessions,
    storiesByCategory,
    themeEvents,
    premiumStoryEvents,
  ] = await Promise.all([
    prisma.familyStory.count(),
    prisma.voiceProfile.count({ where: { deletedAt: null } }),
    prisma.voiceProfile.count({ where: { deletedAt: null, status: "READY" } }),
    prisma.storyPlaySession.findMany({
      where: { createdAt: { gte: since } },
      select: { completed: true, listenedSeconds: true, narratorType: true },
    }),
    prisma.familyStory.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["event"],
      where: {
        createdAt: { gte: since },
        event: {
          in: [
            "family_story_generated",
            "family_story_played",
            "family_story_completed",
            "family_story_narrated",
            "voice_profile_created",
            "premium_feature_used",
          ],
        },
      },
      _count: { id: true },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: since },
        event: "premium_feature_used",
      },
    }),
  ]);

  const completed = playSessions.filter((s) => s.completed).length;
  const completionRate =
    playSessions.length > 0 ? Math.round((completed / playSessions.length) * 100) : 0;

  const avgDuration =
    playSessions.length > 0
      ? Math.round(
          playSessions.reduce((sum, s) => sum + s.listenedSeconds, 0) / playSessions.length
        )
      : 0;

  const familyVoicePlays = playSessions.filter((s) => s.narratorType === "FAMILY_VOICE").length;
  const standardPlays = playSessions.length - familyVoicePlays;

  const avgStoryLength = await prisma.familyStory.aggregate({
    _avg: { lengthMinutes: true },
  });

  return {
    totalStoriesGenerated: totalStories,
    totalVoiceProfiles,
    readyVoiceProfiles,
    averageStoryDurationMinutes: Math.round(avgStoryLength._avg.lengthMinutes ?? 5),
    storyCompletionPercent: completionRate,
    averageListeningSeconds: avgDuration,
    narratorUsage: {
      familyVoice: familyVoicePlays,
      standard: standardPlays,
    },
    mostPopularThemes: storiesByCategory.map((c) => ({
      category: c.category,
      count: c._count.id,
    })),
    eventCounts: Object.fromEntries(themeEvents.map((e) => [e.event, e._count.id])),
    premiumStoryUsage: premiumStoryEvents,
    periodDays: 30,
  };
}
