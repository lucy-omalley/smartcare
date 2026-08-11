import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { persistAnalyticsEventFull } from "@/lib/analytics/persist";
import { sanitizeProperties } from "@/lib/analytics/sanitize";
import type { AnalyticsEvent } from "@/lib/analytics/events";
import { countryFromHeaders, parseUserAgent } from "@/lib/analytics-platform/context";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  try {
    const body = (await request.json()) as {
      event?: string;
      properties?: Record<string, unknown>;
      sessionId?: string;
      feature?: string;
      source?: string;
      device?: string;
      browser?: string;
      platform?: string;
    };
    if (!body.event?.trim()) {
      return NextResponse.json({ error: "Missing event" }, { status: 400 });
    }

    const ua = parseUserAgent(request.headers.get("user-agent"));

    await persistAnalyticsEventFull({
      event: body.event as AnalyticsEvent,
      userId: session?.user?.id ?? null,
      properties: sanitizeProperties(body.properties),
      context: {
        sessionId: body.sessionId,
        feature: body.feature,
        source: body.source,
        device: body.device ?? ua.device,
        browser: body.browser ?? ua.browser,
        platform: body.platform ?? ua.platform,
        country: countryFromHeaders(request.headers),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Track failed" }, { status: 500 });
  }
}
