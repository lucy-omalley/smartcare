import type { UserIntelligenceRow } from "@/lib/analytics-platform/user-intelligence";

export function usersToCsv(users: UserIntelligenceRow[]): string {
  const headers = [
    "id",
    "email",
    "name",
    "registeredAt",
    "lastLogin",
    "lastActive",
    "referralSource",
    "planTier",
    "childAge",
    "totalSessions",
    "avgSessionSec",
    "aiCalls",
    "tokensUsed",
    "aiCostUsd",
    "favouriteFeature",
    "retentionScore",
    "churnRisk",
    "conversionScore",
  ];

  const escape = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    headers.join(","),
    ...users.map((u) =>
      headers.map((h) => escape(u[h as keyof UserIntelligenceRow] as string | number | null)).join(",")
    ),
  ];
  return lines.join("\n");
}
