import { NextResponse } from "next/server";
import { getGrowthIntelligenceDashboard } from "@/lib/analytics-platform/growth-intelligence";
import { founderGuard } from "@/lib/founder-api";

export async function GET() {
  const auth = await founderGuard();
  if (auth instanceof NextResponse) return auth;

  try {
    const data = await getGrowthIntelligenceDashboard();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Growth intelligence error:", error);
    return NextResponse.json({ error: "Failed to load growth dashboard" }, { status: 500 });
  }
}
