import "server-only";

import { prisma } from "@/lib/db";

export async function getRoutineFounderMetrics() {
  const since = new Date(Date.now() - 30 * 86_400_000);

  const [
    totalRoutines,
    aiRoutines,
    completions,
    routinesByTemplate,
    activeUsers,
  ] = await Promise.all([
    prisma.visualRoutine.count({ where: { deletedAt: null } }),
    prisma.visualRoutine.count({ where: { deletedAt: null, isAiGenerated: true } }),
    prisma.routineCompletion.findMany({
      where: { completedAt: { gte: since } },
      select: {
        completed: true,
        stepsCompleted: true,
        stepsTotal: true,
        durationSeconds: true,
        skippedSteps: true,
        routineId: true,
        userId: true,
      },
    }),
    prisma.visualRoutine.groupBy({
      by: ["templateType"],
      where: { deletedAt: null },
      _count: true,
    }),
    prisma.routineCompletion.groupBy({
      by: ["userId"],
      where: { completedAt: { gte: since } },
      _count: true,
    }),
  ]);

  const completed = completions.filter((c) => c.completed);
  const completionRate =
    completions.length > 0 ? Math.round((completed.length / completions.length) * 100) : 0;

  const avgDuration =
    completed.filter((c) => c.durationSeconds).length > 0
      ? Math.round(
          completed.reduce((s, c) => s + (c.durationSeconds ?? 0), 0) /
            completed.filter((c) => c.durationSeconds).length
        )
      : 0;

  const skipCounts = new Map<string, number>();
  for (const c of completions) {
    for (const id of c.skippedSteps) skipCounts.set(id, (skipCounts.get(id) ?? 0) + 1);
  }

  const routineCompletionCounts = new Map<string, number>();
  for (const c of completed) {
    routineCompletionCounts.set(c.routineId, (routineCompletionCounts.get(c.routineId) ?? 0) + 1);
  }

  const topTemplates = routinesByTemplate
    .map((t) => ({ template: t.templateType, count: t._count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    totalRoutinesCreated: totalRoutines,
    aiGeneratedRoutines: aiRoutines,
    completionsLast30Days: completions.length,
    averageCompletionRate: completionRate,
    averageDurationSeconds: avgDuration,
    dailyActiveRoutineUsers: activeUsers.length,
    mostPopularTemplates: topTemplates,
    mostSkippedStepsCount: skipCounts.size,
    retentionSignal: activeUsers.filter((u) => u._count >= 3).length,
  };
}
