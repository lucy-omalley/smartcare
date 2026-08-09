/** Factor weights for Parent Intelligence Engine (sum = 1.0) */
export const SCORING_WEIGHTS = {
  ageFit: 0.25,
  developmentStage: 0.15,
  interests: 0.15,
  goals: 0.12,
  challenges: 0.12,
  weather: 0.08,
  weekday: 0.05,
  history: 0.08,
} as const;

export type ScoringWeightKey = keyof typeof SCORING_WEIGHTS;
