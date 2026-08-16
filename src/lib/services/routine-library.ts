import "server-only";

import { prisma } from "@/lib/db";
import type { RoutineDashboardStats } from "@/types/visual-routine";

function startOfWeek(d = new Date()): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

export async function recordRoutineCompletion(params: {
  userId: string;
  routineId: string;
  stepsCompleted: number;
  stepsTotal: number;
  durationSeconds?: number;
  skippedStepIds?: string[];
  completed?: boolean;
}): Promise<void> {
  const today = new Date();
  const streakDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  await prisma.routineCompletion.create({
    data: {
      userId: params.userId,
      routineId: params.routineId,
      stepsCompleted: params.stepsCompleted,
      stepsTotal: params.stepsTotal,
      durationSeconds: params.durationSeconds,
      skippedSteps: params.skippedStepIds ?? [],
      completed: params.completed ?? params.stepsCompleted >= params.stepsTotal,
      streakDate,
    },
  });
}

export async function getRoutineDashboard(userId: string): Promise<RoutineDashboardStats> {
  const weekStart = startOfWeek();
  const [completions, routines, weekCompletions] = await Promise.all([
    prisma.routineCompletion.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: 200,
    }),
    prisma.visualRoutine.findMany({
      where: { userId, deletedAt: null },
      select: { id: true, title: true, isFavorite: true },
    }),
    prisma.routineCompletion.findMany({
      where: { userId, completedAt: { gte: weekStart } },
    }),
  ]);

  const totalCompletions = completions.length;
  const completedCount = completions.filter((c) => c.completed).length;
  const completionRate = totalCompletions > 0 ? Math.round((completedCount / totalCompletions) * 100) : 0;

  const byRoutine = new Map<string, number>();
  for (const c of completions.filter((x) => x.completed)) {
    byRoutine.set(c.routineId, (byRoutine.get(c.routineId) ?? 0) + 1);
  }
  let mostSuccessfulRoutine: RoutineDashboardStats["mostSuccessfulRoutine"] = null;
  for (const [id, count] of Array.from(byRoutine.entries())) {
    const r = routines.find((x) => x.id === id);
    if (r && (!mostSuccessfulRoutine || count > mostSuccessfulRoutine.count)) {
      mostSuccessfulRoutine = { id, title: r.title, count };
    }
  }

  const skipCounts = new Map<string, number>();
  for (const c of completions) {
    for (const stepId of c.skippedSteps) {
      skipCounts.set(stepId, (skipCounts.get(stepId) ?? 0) + 1);
    }
  }

  let mostSkippedStep: RoutineDashboardStats["mostSkippedStep"] = null;
  if (skipCounts.size > 0) {
    const top = Array.from(skipCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    const step = await prisma.visualRoutineStep.findUnique({ where: { id: top[0] }, select: { title: true } });
    if (step) mostSkippedStep = { title: step.title, count: top[1] };
  }

  const favouriteRoutine = routines.find((r) => r.isFavorite) ?? routines[0];
  const streakDates = Array.from(
    new Set(completions.filter((c) => c.completed).map((c) => c.streakDate.toISOString().slice(0, 10)))
  ).sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let run = 0;
  const todayKey = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < streakDates.length; i++) {
    run = i === 0 ? 1 : streakDates[i] === nextDay(streakDates[i - 1]) ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  }
  if (streakDates.includes(todayKey) || streakDates.includes(prevDay(todayKey))) {
    currentStreak = run;
  }

  const weeklyConsistency = Math.min(100, Math.round((weekCompletions.filter((c) => c.completed).length / 7) * 100));

  const aiRecommendations: string[] = [];
  if (completionRate < 50 && totalCompletions > 2) {
    aiRecommendations.push("Try a shorter routine — 3–4 steps work best for young children.");
  }
  if (mostSkippedStep) {
    aiRecommendations.push(`"${mostSkippedStep.title}" is often skipped — consider making it more playful or moving it earlier.`);
  }
  const hour = new Date().getHours();
  if (hour >= 17 && hour <= 20 && !routines.some((r) => r.title.toLowerCase().includes("bed"))) {
    aiRecommendations.push("Evening is a great time for a Bedtime Routine template.");
  }
  if (aiRecommendations.length === 0) {
    aiRecommendations.push("Keep your favourite routine on a morning or evening schedule for consistency.");
  }

  return {
    totalCompletions,
    completionRate,
    currentStreak,
    longestStreak,
    mostSuccessfulRoutine,
    mostSkippedStep,
    favouriteRoutine: favouriteRoutine ? { id: favouriteRoutine.id, title: favouriteRoutine.title } : null,
    weeklyConsistency,
    aiRecommendations,
  };
}

function nextDay(iso: string): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function prevDay(iso: string): string {
  const d = new Date(iso);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function suggestRoutineForNow(userId: string): Promise<{ routineId: string; title: string; reason: string } | null> {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;

  let timeOfDay: "MORNING" | "AFTERNOON" | "EVENING" = "MORNING";
  if (hour >= 12 && hour < 17) timeOfDay = "AFTERNOON";
  if (hour >= 17) timeOfDay = "EVENING";

  const schedule = await prisma.routineSchedule.findFirst({
    where: {
      userId,
      enabled: true,
      timeOfDay,
      dayType: isWeekend ? "WEEKEND" : "WEEKDAY",
      routine: { deletedAt: null },
    },
    include: { routine: { select: { id: true, title: true } } },
  });
  if (schedule) {
    return { routineId: schedule.routine.id, title: schedule.routine.title, reason: `Scheduled for ${timeOfDay.toLowerCase()}` };
  }

  const templateHint =
    timeOfDay === "MORNING" ? "MORNING" : timeOfDay === "EVENING" ? "BEDTIME" : "AFTER_SCHOOL";

  const routine = await prisma.visualRoutine.findFirst({
    where: { userId, deletedAt: null, templateType: templateHint as never },
    orderBy: { updatedAt: "desc" },
  });
  if (routine) {
    return { routineId: routine.id, title: routine.title, reason: `Suggested for ${timeOfDay.toLowerCase()}` };
  }

  return null;
}
