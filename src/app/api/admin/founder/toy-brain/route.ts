import { NextResponse } from "next/server";
import { requireFounderAccess } from "@/lib/founder-auth";
import { getToyBrainFounderMetrics } from "@/lib/analytics-platform/toy-insights";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireFounderAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const metrics = await getToyBrainFounderMetrics();
  return NextResponse.json({ metrics });
}
