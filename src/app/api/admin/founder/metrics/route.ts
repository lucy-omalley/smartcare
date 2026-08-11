import { NextResponse } from "next/server";
import { requireFounderAccess } from "@/lib/founder-auth";
import { getFounderMetrics } from "@/lib/services/founder-metrics";

export async function GET() {
  const auth = await requireFounderAccess();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const metrics = await getFounderMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Founder metrics error:", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
