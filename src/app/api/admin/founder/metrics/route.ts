import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isFounderAdmin } from "@/lib/admin";
import { getFounderMetrics } from "@/lib/services/founder-metrics";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isFounderAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const metrics = await getFounderMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Founder metrics error:", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
