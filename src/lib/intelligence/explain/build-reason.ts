import type { ScoredCandidate } from "../types";

const FACTOR_LABELS: Record<string, string> = {
  age: "fits your child's age",
  stage: "matches their development stage",
  interests: "connects with their interests",
  goals: "supports your parenting goals",
  challenges: "helps with current challenges",
  weather: "suits today's weather",
  weekday: "fits the day of the week",
  history: "offers fresh variety",
  favourites: "includes foods they enjoy",
  sleep: "supports bedtime routine",
  priority: "aligns with your priority focus",
  personality: "matches their personality",
};

/** Build a human-readable reason from top scoring factors */
export function buildRecommendationReason<T extends { slug: string }>(
  scored: ScoredCandidate<T> | undefined,
  fallback: string
): string {
  if (!scored || scored.disqualified) return fallback;

  const top = [...scored.factors]
    .filter((f) => f.weighted > 0.02)
    .sort((a, b) => b.weighted - a.weighted)
    .slice(0, 3);

  if (top.length === 0) return fallback;

  const parts = top.map((f) => FACTOR_LABELS[f.id] ?? f.label);
  return `Recommended because it ${parts.join(", ")}.`;
}
