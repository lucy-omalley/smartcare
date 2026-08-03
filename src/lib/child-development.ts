/** Shared child age/stage helpers (safe for client and server imports). */

export function parseChildAgeMonths(childAge?: string | null, childBirthday?: string | null): number | null {
  if (childBirthday) {
    const birth = new Date(childBirthday);
    if (!Number.isNaN(birth.getTime())) {
      const now = new Date();
      const months =
        (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
      if (months >= 0 && months <= 216) return months;
    }
  }

  if (!childAge?.trim()) return null;
  const text = childAge.toLowerCase();

  const yearsMonths = text.match(/(\d+)\s*y(?:ear|rs)?(?:\s*(\d+)\s*m(?:onth|o)?)?/);
  if (yearsMonths) {
    const years = parseInt(yearsMonths[1]!, 10);
    const months = yearsMonths[2] ? parseInt(yearsMonths[2]!, 10) : 0;
    return years * 12 + months;
  }

  const monthsOnly = text.match(/(\d+)\s*m(?:onth|o)?/);
  if (monthsOnly) return parseInt(monthsOnly[1]!, 10);

  const yearsOnly = text.match(/(\d+)\s*y(?:ear|rs)?/);
  if (yearsOnly) return parseInt(yearsOnly[1]!, 10) * 12;

  return null;
}

/** Map age to recognised development stage label. */
export function getDevelopmentStage(childAge?: string | null, childBirthday?: string | null): string {
  const months = parseChildAgeMonths(childAge, childBirthday);
  if (months === null) return "Preschool (age unknown)";

  if (months < 6) return "0-6 months";
  if (months < 12) return "6-12 months";
  if (months < 24) return "1 year";
  if (months < 36) return "2 years";
  if (months < 48) return "3 years";
  if (months < 60) return "4 years";
  if (months < 72) return "5 years";
  return `${Math.floor(months / 12)} years`;
}
