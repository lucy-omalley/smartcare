import { NextResponse } from "next/server";
import { getFounderOverview } from "@/lib/analytics-platform/insights";
import { founderGuard } from "@/lib/founder-api";

export async function GET() {
  const auth = await founderGuard();
  if (auth instanceof NextResponse) return auth;

  try {
    const overview = await getFounderOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error("Founder overview error:", error);
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 });
  }
}
