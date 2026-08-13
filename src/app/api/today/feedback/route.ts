import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { rating?: number; comment?: string };
  const rating = body.rating;

  if (!rating || rating < 1 || rating > 3) {
    return NextResponse.json({ error: "Rating must be 1, 2, or 3" }, { status: 400 });
  }

  await prisma.todayPlanFeedback.create({
    data: {
      userId: session.user.id,
      rating,
      comment: body.comment?.trim().slice(0, 1000) || null,
    },
  });

  await persistAnalyticsEvent("today_plan_feedback", session.user.id, { rating });

  return NextResponse.json({ ok: true });
}
