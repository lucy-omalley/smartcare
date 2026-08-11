import { NextResponse } from "next/server";
import { getFounderAiAnalytics } from "@/lib/analytics-platform/ai-analytics";
import { founderGuard } from "@/lib/founder-api";

export async function GET() {
  const auth = await founderGuard();
  if (auth instanceof NextResponse) return auth;

  try {
    const ai = await getFounderAiAnalytics();
    return NextResponse.json(ai);
  } catch (error) {
    console.error("Founder AI analytics error:", error);
    return NextResponse.json({ error: "Failed to load AI analytics" }, { status: 500 });
  }
}
