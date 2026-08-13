import { NextResponse } from "next/server";
import { founderGuard } from "@/lib/founder-api";
import { getFeedbackInsights } from "@/lib/analytics-platform/feedback-insights";

export async function GET() {
  const guard = await founderGuard();
  if ("error" in guard) return guard.error;

  const insights = await getFeedbackInsights();
  return NextResponse.json(insights);
}
