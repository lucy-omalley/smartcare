import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  getCachedTodayRecipeIllustration,
  getOrGenerateTodayRecipeIllustration,
} from "@/lib/services/today-page";

export const maxDuration = 60;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const imageData = await getCachedTodayRecipeIllustration(session.user.id);
  if (!imageData) {
    return NextResponse.json({ error: "Not generated yet" }, { status: 404 });
  }

  return NextResponse.json({ imageData });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const imageData = await getOrGenerateTodayRecipeIllustration(session.user.id);
    return NextResponse.json({ imageData });
  } catch (error) {
    console.error("Today recipe illustration error:", error);
    const message = error instanceof Error ? error.message : "Illustration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
