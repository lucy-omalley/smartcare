import { NextResponse } from "next/server";
import { getFollowUpList } from "@/lib/analytics-platform/growth-intelligence";
import { founderGuard } from "@/lib/founder-api";

function csvEscape(v: string) {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export async function GET() {
  const auth = await founderGuard();
  if (auth instanceof NextResponse) return auth;

  try {
    const list = await getFollowUpList();
    const rows = [
      ...list.registeredInactive,
      ...list.activatedDisappeared,
      ...list.powerUsers,
      ...list.sentFeedback,
    ];

    const headers = ["email", "name", "referralSource", "reason", "lastActive"];
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          csvEscape(r.email),
          csvEscape(r.name),
          csvEscape(String(r.referralSource)),
          csvEscape(r.reason),
          csvEscape("lastActiveAt" in r && r.lastActiveAt ? String(r.lastActiveAt) : ""),
        ].join(",")
      ),
    ];

    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="parenfy-follow-up.csv"',
      },
    });
  } catch (error) {
    console.error("Follow-up export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
