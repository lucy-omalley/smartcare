import { NextResponse } from "next/server";
import { runScheduledVerificationReminders } from "@/lib/auth/email-verification";
import { assertCronAuthorized, cronUnauthorizedResponse } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Daily job (Vercel Hobby: max once/day) — send 1h and 24h verification reminders. */
export async function GET(request: Request) {
  if (!assertCronAuthorized(request)) {
    return cronUnauthorizedResponse();
  }

  try {
    const result = await runScheduledVerificationReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Verification reminder cron error:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
