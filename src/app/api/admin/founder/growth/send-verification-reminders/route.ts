import { NextRequest, NextResponse } from "next/server";
import { founderGuard } from "@/lib/founder-api";
import { sendFounderVerificationReminders } from "@/lib/auth/email-verification";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Founder: send verification reminder emails to unverified users. */
export async function POST(request: NextRequest) {
  const auth = await founderGuard();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      userIds?: string[];
      dryRun?: boolean;
    };

    const result = await sendFounderVerificationReminders({
      userIds: body.userIds,
      dryRun: body.dryRun === true,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Founder verification reminders error:", error);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
