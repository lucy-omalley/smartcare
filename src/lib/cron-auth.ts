import { NextResponse } from "next/server";

/** Authorize Vercel cron or manual invoke with CRON_SECRET. */
export function assertCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export function cronUnauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
