import { NextResponse } from "next/server";
import { getCohortRetention, getDormantUsers } from "@/lib/analytics-platform/retention";
import { founderGuard } from "@/lib/founder-api";

export async function GET() {
  const auth = await founderGuard();
  if (auth instanceof NextResponse) return auth;

  try {
    const [retention, dormant] = await Promise.all([getCohortRetention(8), getDormantUsers(14, 30)]);
    const churnRate =
      retention.summary.day7 > 0 ? Math.max(0, 100 - retention.summary.day7) : 0;
    return NextResponse.json({ retention, dormant, churnRate });
  } catch (error) {
    console.error("Founder retention error:", error);
    return NextResponse.json({ error: "Failed to load retention" }, { status: 500 });
  }
}
