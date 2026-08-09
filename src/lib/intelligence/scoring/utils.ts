export function normalizeTokens(values: string[] | null | undefined): string[] {
  return (values ?? []).map((v) => v.trim().toLowerCase()).filter(Boolean);
}

export function haystack(...parts: Array<string | string[] | null | undefined>): string {
  return parts
    .flatMap((part) => (Array.isArray(part) ? part : part ? [part] : []))
    .join(" ")
    .toLowerCase();
}

/** 0–1 score for age fit within min/max months */
export function ageFitNormalized(
  ageMonths: number | null,
  minAgeMonths: number,
  maxAgeMonths: number
): number {
  if (ageMonths === null) return 0.5;
  if (ageMonths >= minAgeMonths && ageMonths <= maxAgeMonths) return 1;
  if (ageMonths < minAgeMonths) {
    const gap = minAgeMonths - ageMonths;
    return Math.max(0, 1 - gap / 12);
  }
  const gap = ageMonths - maxAgeMonths;
  return Math.max(0, 1 - gap / 18);
}

/** Count token matches in text (0–1 capped) */
export function tokenMatchScore(text: string, tokens: string[]): number {
  if (!tokens.length) return 0;
  let hits = 0;
  for (const token of tokens) {
    if (token.length >= 3 && text.includes(token)) hits += 1;
  }
  return Math.min(1, hits / Math.max(1, Math.min(tokens.length, 4)));
}

export function stageDomainBoost(stage: string, categoryOrTags: string): number {
  const s = stage.toLowerCase();
  const c = categoryOrTags.toLowerCase();
  if (/0-6|6-12|1 year|2 year/i.test(stage) && /speech|language|motor/i.test(c)) return 0.8;
  if (/3 year|4 year/i.test(stage) && /social|cognitive|emotional/i.test(c)) return 0.8;
  if (/5 year|6 year/i.test(stage) && /independence|cognitive|social/i.test(c)) return 0.8;
  if (s.includes("year") && c.includes("general")) return 0.5;
  return 0.3;
}
