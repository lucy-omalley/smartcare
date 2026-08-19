import { NextResponse } from "next/server";
import { getGrowthIntelligenceDashboard } from "@/lib/analytics-platform/growth-intelligence";
import {
  growthReportFilename,
  growthReportToCsv,
} from "@/lib/analytics-platform/growth-report-export";
import { founderGuard } from "@/lib/founder-api";

export async function GET() {
  const auth = await founderGuard();
  if (auth instanceof NextResponse) return auth;

  try {
    const data = await getGrowthIntelligenceDashboard();
    const csv = growthReportToCsv(data);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${growthReportFilename()}"`,
      },
    });
  } catch (error) {
    console.error("Growth report export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
