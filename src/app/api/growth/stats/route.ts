import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getTodayPageData } from "@/lib/services/today-page";
import { SKILL_CATALOG } from "@/lib/growth-journey/stages";
import { getGrowthActivitySnapshot } from "@/lib/growth-journey/metrics";

export const dynamic = "force-dynamic";

/** Lightweight weekly progress for Today dashboard cards */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const todayData = await getTodayPageData(session.user.id);
    const brief = todayData.brief;
    const briefSignals = [
      brief.weeklyFocus?.title ?? "",
      brief.todayFocus?.title ?? "",
      ...brief.development.map((d) => `${d.domain} ${d.insight}`),
      ...(brief.play.skillsDeveloped ?? []),
      brief.play.title,
    ].filter(Boolean);

    const snapshot = await getGrowthActivitySnapshot(session.user.id, briefSignals, SKILL_CATALOG);

    return NextResponse.json({
      stats: {
        weeklyProgressPercent: snapshot.weeklyProgressPercent,
        activitiesCompleted: snapshot.weeklyCompletedMissions,
        activitiesTarget: snapshot.activitiesTarget,
        hasActivityHistory: snapshot.hasActivityHistory,
      },
    });
  } catch (error) {
    console.error("Growth stats error:", error);
    return NextResponse.json({ error: "Failed to load growth stats" }, { status: 500 });
  }
}
