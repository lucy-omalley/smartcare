import { NextResponse } from "next/server";
import { getErrorDashboard } from "@/lib/analytics-platform/errors-dashboard";
import { founderGuard } from "@/lib/founder-api";

export async function GET() {
  const auth = await founderGuard();
  if (auth instanceof NextResponse) return auth;

  try {
    const errors = await getErrorDashboard(14);
    return NextResponse.json(errors);
  } catch (error) {
    console.error("Founder errors error:", error);
    return NextResponse.json({ error: "Failed to load errors" }, { status: 500 });
  }
}
