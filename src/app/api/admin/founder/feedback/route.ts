import { NextResponse } from "next/server";
import { founderGuard } from "@/lib/founder-api";
import { getFeedbackInsights } from "@/lib/analytics-platform/feedback-insights";

export async function GET() {
  const auth = await founderGuard();
  if (auth instanceof NextResponse) return auth;

  const insights = await getFeedbackInsights();
  return NextResponse.json(insights);
}
