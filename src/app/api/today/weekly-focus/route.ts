import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { refreshUserWeeklyFocus } from "@/lib/services/daily-brief";

export const maxDuration = 60;

/** Manually refresh this week's development focus (stays for 7 days until refreshed again). */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const weeklyFocus = await refreshUserWeeklyFocus(session.user.id);
    return NextResponse.json({ weeklyFocus });
  } catch (error) {
    console.error("Weekly focus refresh error:", error);
    const message = error instanceof Error ? error.message : "Refresh failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
