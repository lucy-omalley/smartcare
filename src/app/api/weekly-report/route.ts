import { NextResponse } from "next/server";
import { aiGuardErrorResponse, requireAiSession } from "@/lib/auth/session-guards";
import { getOrGenerateWeeklyGrowthReport } from "@/lib/services/weekly-growth-report";
import { mapAiRouteError } from "@/lib/ai/route-errors";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";

export const maxDuration = 60;

export async function GET() {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  try {
    const report = await getOrGenerateWeeklyGrowthReport(guard.userId);
    await persistAnalyticsEvent("weekly_report_viewed", guard.userId, { cached: report.cached });
    return NextResponse.json(report);
  } catch (error) {
    const mapped = mapAiRouteError(error);
    return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}
