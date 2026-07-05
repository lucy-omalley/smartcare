import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

export const dynamic = "force-dynamic";

type FeedbackBody = {
  enjoyed?: string;
  confused?: string;
  improve?: string;
  recommend?: string;
  rating?: number;
  page?: string;
  deviceType?: string;
  appVersion?: string;
};

function trimField(value: unknown, max = 2000): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = (await req.json()) as FeedbackBody;

    const rating = typeof body.rating === "number" ? Math.round(body.rating) : null;
    if (rating === null || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const userId = session?.user?.id;
    let daysSinceSignup: number | undefined;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      });
      if (user) {
        daysSinceSignup = Math.floor(
          (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
      }
    }

    const feedback = await prisma.betaFeedback.create({
      data: {
        userId: userId ?? null,
        enjoyed: trimField(body.enjoyed),
        confused: trimField(body.confused),
        improve: trimField(body.improve),
        recommend: trimField(body.recommend),
        rating,
        page: trimField(body.page, 200),
        deviceType: trimField(body.deviceType, 100),
        appVersion: trimField(body.appVersion, 50),
        signedIn: Boolean(userId),
        daysSinceSignup,
      },
    });

    const analyticsProps = {
      rating,
      page: feedback.page,
      device_type: feedback.deviceType,
      signed_in: feedback.signedIn,
      days_since_signup: daysSinceSignup,
      has_recommend: Boolean(feedback.recommend),
    };

    await Promise.allSettled([
      persistAnalyticsEvent("feedback_submitted", userId, analyticsProps),
      userId ? captureServerEvent(userId, "feedback_submitted", analyticsProps) : Promise.resolve(),
    ]);

    return NextResponse.json({ ok: true, id: feedback.id });
  } catch (error) {
    console.error("Feedback submit error:", error);
    return NextResponse.json({ error: "Could not save feedback. Please try again." }, { status: 500 });
  }
}
