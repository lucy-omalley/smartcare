import { NextRequest, NextResponse } from "next/server";
import { getUserIntelligenceList } from "@/lib/analytics-platform/user-intelligence";
import { founderGuard } from "@/lib/founder-api";

export async function GET(request: NextRequest) {
  const auth = await founderGuard();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 50);
  const offset = Number(searchParams.get("offset") ?? 0);

  try {
    const data = await getUserIntelligenceList({ search, limit, offset });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Founder users error:", error);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
