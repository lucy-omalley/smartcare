export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function parseAgeRecommendation(age?: string): { minAgeMonths: number; maxAgeMonths: number } {
  if (!age) return { minAgeMonths: 24, maxAgeMonths: 72 };
  const match = age.match(/(\d+)\s*-\s*(\d+)/);
  if (!match) return { minAgeMonths: 24, maxAgeMonths: 72 };
  return {
    minAgeMonths: parseInt(match[1], 10) * 12,
    maxAgeMonths: parseInt(match[2], 10) * 12,
  };
}

export function toChildTemplate(text: string, childName: string): string {
  return text.replace(new RegExp(childName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "{child}");
}
