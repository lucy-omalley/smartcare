import { NextResponse } from "next/server";
import { requireFounderAccess } from "@/lib/founder-auth";

export async function founderGuard() {
  const auth = await requireFounderAccess();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  return auth;
}
