import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";
import { sanitizeProperties } from "@/lib/analytics/sanitize";
import type { AnalyticsEvent } from "@/lib/analytics/events";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  try {
    const body = (await request.json()) as { event?: string; properties?: Record<string, unknown> };
    if (!body.event?.trim()) {
      return NextResponse.json({ error: "Missing event" }, { status: 400 });
    }

    await persistAnalyticsEvent(
      body.event as AnalyticsEvent,
      session?.user?.id ?? null,
      sanitizeProperties(body.properties)
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Track failed" }, { status: 500 });
  }
}
