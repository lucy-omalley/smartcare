import { format } from "date-fns";
import type { GrowthIntelligenceDashboard } from "@/lib/analytics-platform/growth-intelligence";

function csvEscape(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function section(title: string, rows: string[]): string[] {
  return [`# ${title}`, ...rows, ""];
}

function table(headers: string[], rows: (string | number | null | undefined)[][]): string[] {
  return [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => csvEscape(cell)).join(",")),
  ];
}

/** Multi-section CSV suitable for Excel / Google Sheets. */
export function growthReportToCsv(data: GrowthIntelligenceDashboard): string {
  const generated = format(new Date(data.generatedAt), "yyyy-MM-dd HH:mm");
  const lines: string[] = [
    "# Parenfy Growth Intelligence Report",
    `# Generated,${csvEscape(generated)}`,
    `# Privacy,GDPR-safe — no child content included`,
    "",
  ];

  const ns = data.northStar;
  const pulse = data.activationPulse;
  lines.push(
    ...section("Activation pulse (today)", [
      ...table(
        ["metric", "value"],
        [
          ["Activation rate today %", pulse.activationRateToday],
          ["Returning users today", pulse.returningUsersToday],
          ["Best hero feature", data.hero.bestPerforming],
          ["Top acquisition source", data.referral.topSource],
          ["Avg time to WOW (min)", pulse.avgTimeToWowMinutes ?? ""],
          ["WOW target (min)", pulse.wowTargetMinutes],
        ]
      ),
    ])
  );

  lines.push(
    ...section("North Star — Activated Users", [
      ...table(
        ["metric", "value"],
        [
          ["Activated today", ns.activatedToday],
          ["Activated this week", ns.activatedThisWeek],
          ["Total activated", ns.totalActivated],
          ["Activation rate %", ns.activationRate],
          ["Total signups", ns.signupsTotal],
          ["Signups this week", ns.signupsThisWeek],
          ["Accounts created (30d)", ns.signupsLast30Days],
        ]
      ),
    ])
  );

  if (data.funnelDropOff) {
    lines.push(
      ...section("Funnel — biggest drop-off", [
        ...table(
          ["stage", "count", "conversion_from_previous_pct"],
          [
            [
              data.funnelDropOff.label,
              data.funnelDropOff.count,
              data.funnelDropOff.conversionFromPrevious ?? "",
            ],
          ]
        ),
      ])
    );
  }

  lines.push(
    ...section("Growth funnel (30 days)", [
      ...table(
        ["stage", "count", "conversion_from_previous_pct", "conversion_from_start_pct"],
        data.funnel.map((s) => [
          s.label,
          s.count,
          s.conversionFromPrevious ?? "",
          s.conversionFromStart,
        ])
      ),
    ])
  );

  lines.push(
    ...section("Acquisition sources", [
      `top_source,${csvEscape(data.referral.topSource)}`,
      ...table(
        ["source", "signups", "activated", "conversion_rate_pct", "retention_rate_pct"],
        data.referral.sources.map((s) => [
          s.source,
          s.signups,
          s.activated,
          s.conversionRate,
          s.retentionRate,
        ])
      ),
    ])
  );

  lines.push(
    ...section("Hero features (30 days)", [
      `best_performing,${csvEscape(data.hero.bestPerforming)}`,
      ...table(
        [
          "feature",
          "views",
          "started",
          "completed",
          "saved",
          "printed",
          "shared",
          "weekly_events_7d",
        ],
        data.hero.features.map((f) => [
          f.label,
          f.views,
          f.started,
          f.completed,
          f.saved,
          f.printed,
          f.shared,
          f.weeklyTrend,
        ])
      ),
    ])
  );

  const ret = data.retention;
  lines.push(
    ...section("Retention", [
      ...table(
        ["metric", "value_pct"],
        [
          ["Day 1 retention", ret.summary.day1],
          ["Day 3 retention", ret.summary.day3],
          ["Day 7 retention", ret.summary.day7],
          ["Day 14 retention", ret.summary.day14],
          ["Day 30 retention", ret.summary.day30],
          ["Weekly returning", ret.weeklyReturning],
          ["Monthly returning", ret.monthlyReturning],
        ]
      ),
      ...table(
        ["cohort_week", "size", "day1_pct", "day3_pct", "day7_pct", "day14_pct", "day30_pct"],
        ret.cohorts.map((c) => [c.cohortWeek, c.size, c.day1, c.day3, c.day7, c.day14, c.day30])
      ),
    ])
  );

  lines.push(
    ...section("Power user segments", [
      ...table(
        ["segment", "count"],
        Object.entries(data.powerUsers).map(([segment, count]) => [segment, count])
      ),
    ])
  );

  const exit = data.exit;
  lines.push(
    ...section("Exit analytics", [
      `avg_session_seconds,${exit.avgSessionSec ?? ""}`,
      `abandoned_onboarding,${exit.abandonedOnboarding}`,
      `abandoned_toy_brain,${exit.abandonedToyBrain}`,
      `abandoned_story,${exit.abandonedStory}`,
      `abandoned_adventure,${exit.abandonedHero}`,
      ...table(
        ["exit_page", "sessions"],
        exit.topExitPages.map((e) => [e.path, e.count])
      ),
    ])
  );

  const ob = data.onboarding;
  lines.push(
    ...section("Onboarding", [
      ...table(
        ["metric", "value"],
        [
          ["Started", ob.started],
          ["Completed", ob.completed],
          ["Skipped step", ob.skipped],
          ["Completion rate %", ob.completionRate],
          ["Drop-off count", ob.dropOff],
        ]
      ),
    ])
  );

  lines.push(
    ...section("Weekly insights", [
      `headline,${csvEscape(data.weeklyInsights.headline)}`,
      ...table(
        ["insight"],
        data.weeklyInsights.bullets.map((b) => [b])
      ),
    ])
  );

  if (data.alerts.length > 0) {
    lines.push(
      ...section("Founder alerts", [
        ...table(
          ["level", "title", "message"],
          data.alerts.map((a) => [a.level, a.title, a.message])
        ),
      ])
    );
  }

  lines.push(
    ...section("AI signals", [
      ...table(
        ["metric", "value"],
        [
          ["AI cost today USD", data.ai.todayCost.toFixed(2)],
          ["Cache hit rate %", data.ai.cacheHitPct],
        ]
      ),
    ])
  );

  const followUpSections = [
    { title: "Follow-up — email not verified", rows: data.followUp.unverifiedEmail },
    { title: "Follow-up — registered inactive", rows: data.followUp.registeredInactive },
    { title: "Follow-up — activated disappeared", rows: data.followUp.activatedDisappeared },
    { title: "Follow-up — power users", rows: data.followUp.powerUsers },
    { title: "Follow-up — sent feedback", rows: data.followUp.sentFeedback },
  ];

  for (const { title, rows } of followUpSections) {
    lines.push(
      ...section(title, [
        ...table(
          ["email", "name", "referral_source", "reason", "last_active"],
          rows.map((r) => [
            r.email,
            r.name ?? "",
            r.referralSource,
            r.reason,
            "lastActiveAt" in r && r.lastActiveAt ? String(r.lastActiveAt) : "",
          ])
        ),
      ])
    );
  }

  return lines.join("\n");
}

export function growthReportFilename(): string {
  return `parenfy-growth-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
}
