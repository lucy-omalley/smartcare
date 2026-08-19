import { NextResponse } from "next/server";
import { getGrowthFunnel } from "@/lib/analytics-platform/growth-intelligence";
import { founderGuard } from "@/lib/founder-api";
import { subDays, startOfDay } from "date-fns";

export async function GET() {
  const auth = await founderGuard();
  if (auth instanceof NextResponse) return auth;

  try {
    const funnel = await getGrowthFunnel(subDays(startOfDay(new Date()), 30));
    return NextResponse.json({ funnel });
  } catch (error) {
    console.error("Founder funnel error:", error);
    return NextResponse.json({ error: "Failed to load funnel" }, { status: 500 });
  }
}
