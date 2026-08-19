import { NextRequest, NextResponse } from "next/server";
import { getUserTimeline } from "@/lib/analytics-platform/growth-intelligence";
import { founderGuard } from "@/lib/founder-api";

export async function GET(request: NextRequest) {
  const auth = await founderGuard();
  if (auth instanceof NextResponse) return auth;

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const timeline = await getUserTimeline(userId);
    return NextResponse.json(timeline);
  } catch (error) {
    console.error("User timeline error:", error);
    return NextResponse.json({ error: "Failed to load timeline" }, { status: 500 });
  }
}
