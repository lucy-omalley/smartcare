import { NextResponse } from "next/server";
import { requireFounderAccess } from "@/lib/founder-auth";
import { getStorytimeFounderMetrics } from "@/lib/analytics-platform/storytime-insights";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireFounderAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const metrics = await getStorytimeFounderMetrics();
  return NextResponse.json({ metrics, generatedAt: new Date().toISOString() });
}
