import { NextResponse } from "next/server";
import { requireFounderAccess } from "@/lib/founder-auth";
import { getRoutineFounderMetrics } from "@/lib/analytics-platform/routine-insights";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireFounderAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const metrics = await getRoutineFounderMetrics();
  return NextResponse.json({ metrics });
}
