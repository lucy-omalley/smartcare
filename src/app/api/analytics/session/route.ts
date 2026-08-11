import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { countryFromHeaders, parseUserAgent } from "@/lib/analytics-platform/context";
import { normalizeReferralSource } from "@/lib/analytics-platform/referral";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  try {
    const body = (await request.json()) as {
      sessionId?: string;
      path?: string;
      referrerSource?: string;
      action?: "start" | "heartbeat" | "end";
    };

    if (!body.sessionId?.trim()) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const ua = parseUserAgent(request.headers.get("user-agent"));
    const country = countryFromHeaders(request.headers);
    const userId = session?.user?.id ?? null;
    const action = body.action ?? "heartbeat";

    if (action === "start") {
      await prisma.analyticsSession.upsert({
        where: { sessionId: body.sessionId },
        create: {
          sessionId: body.sessionId,
          userId,
          platform: ua.platform,
          device: ua.device,
          browser: ua.browser,
          country,
          referrerSource: normalizeReferralSource(body.referrerSource),
          pageViews: body.path ? 1 : 0,
        },
        update: {
          userId: userId ?? undefined,
          pageViews: body.path ? { increment: 1 } : undefined,
        },
      });
    } else if (action === "end") {
      const existing = await prisma.analyticsSession.findUnique({
        where: { sessionId: body.sessionId },
      });
      if (existing) {
        const durationSec = Math.round((Date.now() - existing.startedAt.getTime()) / 1000);
        await prisma.analyticsSession.update({
          where: { sessionId: body.sessionId },
          data: {
            endedAt: new Date(),
            durationSec,
            exitPath: body.path,
            bounced: existing.pageViews <= 1 && durationSec < 30,
          },
        });
      }
    } else {
      const existing = await prisma.analyticsSession.findUnique({
        where: { sessionId: body.sessionId },
      });
      if (existing && body.path) {
        await prisma.analyticsSession.update({
          where: { sessionId: body.sessionId },
          data: { pageViews: { increment: 1 }, exitPath: body.path },
        });
      }
    }

    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Session track error:", error);
    return NextResponse.json({ error: "Session track failed" }, { status: 500 });
  }
}
