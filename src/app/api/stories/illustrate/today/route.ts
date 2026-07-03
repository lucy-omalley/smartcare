import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  getCachedTodayStoryIllustration,
  getOrGenerateTodayStoryIllustration,
} from "@/lib/services/today-page";

export const maxDuration = 60;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const illustrationData = await getCachedTodayStoryIllustration(session.user.id);
  if (!illustrationData) {
    return NextResponse.json({ error: "Not generated yet" }, { status: 404 });
  }

  return NextResponse.json({ illustrationData });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const illustrationData = await getOrGenerateTodayStoryIllustration(session.user.id);
    return NextResponse.json({ illustrationData });
  } catch (error) {
    console.error("Today story illustration error:", error);
    const message = error instanceof Error ? error.message : "Illustration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
