import { trackEvent } from "@/lib/analytics/track";

const FIRST_VISIT_KEY = "parenfy_first_visit";
const WEEK_KEY = "parenfy_wau_week";
const MONTH_KEY = "parenfy_mau_month";

function weekId(d = new Date()): string {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start.toISOString().slice(0, 10);
}

function monthId(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Track retention milestones on active session (Today dashboard or app open). */
export function trackReturnVisit(): void {
  if (typeof window === "undefined") return;

  const now = Date.now();
  const raw = localStorage.getItem(FIRST_VISIT_KEY);
  if (!raw) {
    localStorage.setItem(FIRST_VISIT_KEY, String(now));
    return;
  }

  const firstVisit = parseInt(raw, 10);
  if (Number.isNaN(firstVisit)) return;

  const days = Math.floor((now - firstVisit) / (1000 * 60 * 60 * 24));

  const mark = (key: string, event: "day_1_return" | "day_3_return" | "day_7_return" | "day_30_return") => {
    if (localStorage.getItem(key)) return;
    trackEvent(event, { days_since_signup: days });
    localStorage.setItem(key, "1");
  };

  if (days >= 1) mark("parenfy_day1_tracked", "day_1_return");
  if (days >= 3) mark("parenfy_day3_tracked", "day_3_return");
  if (days >= 7) mark("parenfy_day7_tracked", "day_7_return");
  if (days >= 30) mark("parenfy_day30_tracked", "day_30_return");

  const wk = weekId();
  if (localStorage.getItem(WEEK_KEY) !== wk) {
    trackEvent("weekly_active_user", { week: wk });
    localStorage.setItem(WEEK_KEY, wk);
  }

  const mo = monthId();
  if (localStorage.getItem(MONTH_KEY) !== mo) {
    trackEvent("monthly_active_user", { month: mo });
    localStorage.setItem(MONTH_KEY, mo);
  }
}
