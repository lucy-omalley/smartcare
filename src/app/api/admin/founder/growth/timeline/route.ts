import { NextRequest, NextResponse } from "next/server";
import { getUserTimeline } from "@/lib/analytics-platform/growth-intelligence";
import {
  resolveFounderTimelineUser,
  searchFounderTimelineUsers,
} from "@/lib/analytics-platform/user-intelligence";
import { founderGuard } from "@/lib/founder-api";

export async function GET(request: NextRequest) {
  const auth = await founderGuard();
  if (auth instanceof NextResponse) return auth;

  const params = request.nextUrl.searchParams;
  const userId = params.get("userId")?.trim();
  const email = params.get("email")?.trim();
  const q = params.get("q")?.trim();
  const searchOnly = params.get("search") === "1";

  const lookup = userId || email || q;
  if (!lookup) {
    return NextResponse.json({ error: "Provide email, name, or user id" }, { status: 400 });
  }

  try {
    if (searchOnly) {
      const candidates = await searchFounderTimelineUsers(lookup);
      return NextResponse.json({ candidates });
    }

    let resolvedId = userId;
    if (!resolvedId) {
      const user = await resolveFounderTimelineUser(email ?? lookup);
      if (!user) {
        const candidates = await searchFounderTimelineUsers(lookup);
        if (candidates.length > 1) {
          return NextResponse.json({ error: "Multiple users matched", candidates }, { status: 409 });
        }
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      resolvedId = user.id;
    }

    const timeline = await getUserTimeline(resolvedId);
    return NextResponse.json(timeline);
  } catch (error) {
    console.error("User timeline error:", error);
    return NextResponse.json({ error: "Failed to load timeline" }, { status: 500 });
  }
}
