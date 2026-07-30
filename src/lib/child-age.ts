import { differenceInMonths, format, isValid, lastDayOfMonth, parseISO } from "date-fns";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export interface BirthdayParts {
  year: string;
  month: string;
  day: string;
}

/** Format age as "3 years 2 months" from a birthday (updates with the calendar). */
export function formatChildAgeFromBirthday(
  birthday: string | Date | null | undefined,
  asOf: Date = new Date()
): string | null {
  const birth = parseBirthdayDate(birthday);
  if (!birth) return null;

  const totalMonths = differenceInMonths(asOf, birth);
  if (totalMonths < 0) return null;

  if (totalMonths < 1) return "under 1 month";
  if (totalMonths < 12) {
    return totalMonths === 1 ? "1 month" : `${totalMonths} months`;
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (months === 0) {
    return years === 1 ? "1 year" : `${years} years`;
  }

  const yearPart = years === 1 ? "1 year" : `${years} years`;
  const monthPart = months === 1 ? "1 month" : `${months} months`;
  return `${yearPart} ${monthPart}`;
}

export function parseBirthdayDate(birthday: string | Date | null | undefined): Date | null {
  if (!birthday) return null;
  const date = typeof birthday === "string" ? parseISO(birthday) : birthday;
  return isValid(date) ? date : null;
}

export function isValidBirthdayISO(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const date = parseISO(iso);
  if (!isValid(date)) return false;
  if (format(date, "yyyy-MM-dd") !== iso) return false;
  if (date > new Date()) return false;
  const minYear = new Date().getFullYear() - 18;
  if (date.getFullYear() < minYear) return false;
  return true;
}

export function birthdayPartsFromISO(iso: string | null | undefined): BirthdayParts {
  const date = parseBirthdayDate(iso);
  if (!date) return { year: "", month: "", day: "" };
  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1),
    day: String(date.getDate()),
  };
}

export function isoFromBirthdayParts(year: string, month: string, day: string): string | null {
  if (!year || !month || !day) return null;
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;

  const iso = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return isValidBirthdayISO(iso) ? iso : null;
}

export function formatBirthdayDisplay(iso: string | null | undefined): string | null {
  const date = parseBirthdayDate(iso);
  if (!date) return null;
  return format(date, "d MMMM yyyy");
}

export function resolveChildAgeDisplay(profile: {
  childBirthday?: string | null;
  childAge?: string | null;
}): string | null {
  if (profile.childBirthday) {
    return formatChildAgeFromBirthday(profile.childBirthday);
  }
  return profile.childAge?.trim() || null;
}

export function enrichProfileWithChildAge<T extends { childBirthday?: string | null; childAge?: string | null }>(
  profile: T | null
): T | null {
  if (!profile) return profile;
  const childAge = resolveChildAgeDisplay(profile);
  if (!childAge) return profile;
  return { ...profile, childAge };
}

export function childBirthdayYearOptions(maxAgeYears = 18): string[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: maxAgeYears + 1 }, (_, i) => String(currentYear - i));
}

export function childBirthdayMonthOptions(): { value: string; label: string }[] {
  return MONTH_NAMES.map((label, index) => ({
    value: String(index + 1),
    label,
  }));
}

export function childBirthdayDayOptions(year: string, month: string): string[] {
  if (!year || !month) return Array.from({ length: 31 }, (_, i) => String(i + 1));
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    return Array.from({ length: 31 }, (_, i) => String(i + 1));
  }
  const lastDay = lastDayOfMonth(new Date(y, m - 1, 1)).getDate();
  return Array.from({ length: lastDay }, (_, i) => String(i + 1));
}

export function isBirthdayComplete(year: string, month: string, day: string): boolean {
  return isoFromBirthdayParts(year, month, day) !== null;
}
