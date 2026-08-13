import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { aiGuardErrorResponse, requireAiSession } from "@/lib/auth/session-guards";
import { generateLearningPlan } from "@/lib/services/learning-plan";
import { mapAiRouteError } from "@/lib/ai/route-errors";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";

export const maxDuration = 60;

export async function POST(request: Request) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  try {
    const body = (await request.json()) as { durationMinutes?: number };
    const plan = await generateLearningPlan(guard.userId, {
      durationMinutes: body.durationMinutes,
    });

    await persistAnalyticsEvent("learning_plan_generated", guard.userId);

    return NextResponse.json({ plan });
  } catch (error) {
    const mapped = mapAiRouteError(error);
    return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prisma } = await import("@/lib/db");
  const latest = await prisma.learningPlan.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ plan: latest?.content ?? null, createdAt: latest?.createdAt ?? null });
}
