import { NextResponse } from "next/server";
import { getBetaUserDashboard } from "@/lib/analytics-platform/beta-dashboard";
import { founderGuard } from "@/lib/founder-api";

export async function GET() {
  const auth = await founderGuard();
  if (auth instanceof NextResponse) return auth;

  try {
    const beta = await getBetaUserDashboard(20);
    return NextResponse.json(beta);
  } catch (error) {
    console.error("Founder beta dashboard error:", error);
    return NextResponse.json({ error: "Failed to load beta dashboard" }, { status: 500 });
  }
}
