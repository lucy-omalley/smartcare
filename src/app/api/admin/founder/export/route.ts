import { NextRequest, NextResponse } from "next/server";
import { getUserIntelligenceList } from "@/lib/analytics-platform/user-intelligence";
import { usersToCsv } from "@/lib/analytics-platform/export-csv";
import { founderGuard } from "@/lib/founder-api";

export async function GET(request: NextRequest) {
  const auth = await founderGuard();
  if (auth instanceof NextResponse) return auth;

  const search = request.nextUrl.searchParams.get("search") ?? undefined;

  try {
    const { users } = await getUserIntelligenceList({ search, limit: 5000, offset: 0 });
    const csv = usersToCsv(users);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="parenfy-users-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Founder export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
