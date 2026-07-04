import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { persistAnalyticsError } from "@/lib/analytics/persist";
import { sanitizeProperties } from "@/lib/analytics/sanitize";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  try {
    const body = (await request.json()) as {
      source?: string;
      message?: string;
      metadata?: Record<string, unknown>;
    };
    if (!body.source || !body.message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await persistAnalyticsError(
      body.source,
      body.message,
      session?.user?.id ?? null,
      sanitizeProperties(body.metadata)
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error log failed" }, { status: 500 });
  }
}
