import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { buildPlanContext } from "@/lib/knowledge/repository";
import { enrichProfileWithChildAge } from "@/lib/child-age";
import type { BriefProfile } from "@/lib/daily-brief-context";
import { gatherAIMemorySignals } from "@/lib/services/today-recommendation-engine";
import { fetchWeatherForLocation } from "@/lib/services/weather";
import { recommendTodayPlanPicks } from "@/lib/intelligence/recommend-today-plan";
import { recommendWeeklyFocusPick } from "@/lib/intelligence/recommend-weekly-focus";
import {
  rankScored,
  scoreRecipe,
  scoreActivity,
  scoreStory,
} from "@/lib/intelligence/scoring/score-candidate";

export const dynamic = "force-dynamic";

async function requireAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  return Boolean(user?.isAdmin);
}

function serializeScored<T extends { slug: string }>(
  scored: import("@/lib/intelligence/types").ScoredCandidate<T>[]
) {
  return scored.slice(0, 12).map((s) => ({
    slug: s.item.slug,
    total: s.total,
    disqualified: s.disqualified ?? false,
    disqualifyReason: s.disqualifyReason,
    factors: s.factors.map((f) => ({
      id: f.id,
      label: f.label,
      weight: f.weight,
      raw: Math.round(f.raw * 100) / 100,
      weighted: Math.round(f.weighted * 1000) / 1000,
    })),
  }));
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed =
    (await requireAdmin(session.user.id)) || session.user.email === process.env.ADMIN_EMAIL;
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("userId") ?? session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      email: true,
      name: true,
      childNickname: true,
      childAge: true,
      childBirthday: true,
      childGender: true,
      childInterests: true,
      favouriteToys: true,
      favouriteThemes: true,
      favouriteBooks: true,
      favouriteFoods: true,
      foodDislikes: true,
      sleepRoutine: true,
      personality: true,
      homeLanguage: true,
      foodPreferences: true,
      routineNotes: true,
      developmentNotes: true,
      parentingGoal: true,
      parentingGoals: true,
      priorityGoal: true,
      currentChallenges: true,
      location: true,
      broadArea: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const profile = enrichProfileWithChildAge(user as BriefProfile) ?? (user as BriefProfile);
  const memory = await gatherAIMemorySignals(targetUserId);
  const weatherResult = profile.location ? await fetchWeatherForLocation(profile.location) : null;
  const ctx = buildPlanContext(profile, weatherResult?.weather ?? null);

  const [todayPlan, weeklyFocus] = await Promise.all([
    recommendTodayPlanPicks({ userId: targetUserId, profile, ctx, memory }),
    recommendWeeklyFocusPick({ userId: targetUserId, profile, ctx, memory }),
  ]);

  const recipeRanked = rankScored(todayPlan.pool.recipes.map((r) => scoreRecipe(todayPlan.signals, r)));
  const activityRanked = rankScored(
    todayPlan.pool.activities.map((a) => scoreActivity(todayPlan.signals, a))
  );
  const storyRanked = rankScored(todayPlan.pool.stories.map((s) => scoreStory(todayPlan.signals, s)));

  return NextResponse.json({
    userId: targetUserId,
    email: user.email,
    context: {
      ageMonths: ctx.ageMonths,
      isWeekend: ctx.isWeekend,
      isRainy: ctx.isRainy,
      isSunny: ctx.isSunny,
      weather: ctx.weather?.description ?? null,
    },
    signals: {
      developmentStage: todayPlan.signals.developmentStage,
      interests: todayPlan.signals.interests,
      goals: todayPlan.signals.goals,
      challenges: todayPlan.signals.challenges,
      favouriteFoods: todayPlan.signals.favouriteFoods,
      foodDislikes: todayPlan.signals.foodDislikes,
      mood: todayPlan.signals.mood,
      nearby: {
        ...todayPlan.signals.nearby,
        highlightEvent: todayPlan.signals.nearby.highlightEvent
          ? {
              ...todayPlan.signals.nearby.highlightEvent,
              date: todayPlan.signals.nearby.highlightEvent.date.toISOString(),
            }
          : null,
      },
    },
    todayPlan: {
      picks: {
        recipeSlug: todayPlan.recipeSlug,
        activitySlug: todayPlan.activitySlug,
        storySlug: todayPlan.storySlug,
        tipSlug: todayPlan.tipSlug,
        milestoneSlug: todayPlan.milestoneSlug,
        reasons: todayPlan.reasons,
      },
      poolSizes: {
        recipes: todayPlan.pool.recipes.length,
        activities: todayPlan.pool.activities.length,
        stories: todayPlan.pool.stories.length,
        tips: todayPlan.pool.tips.length,
        milestones: todayPlan.pool.milestones.length,
      },
      ranked: {
        recipes: serializeScored(recipeRanked),
        activities: serializeScored(activityRanked),
        stories: serializeScored(storyRanked),
      },
    },
    weeklyFocus: {
      pick: {
        themeSlug: weeklyFocus.themeSlug,
        title: weeklyFocus.title,
        reason: weeklyFocus.reason,
      },
      ranked: serializeScored(weeklyFocus.ranked),
    },
  });
}
