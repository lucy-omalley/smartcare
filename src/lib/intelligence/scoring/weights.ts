/** Factor weights for Parent Intelligence Engine (sum = 1.0) */
export const SCORING_WEIGHTS = {
  ageFit: 0.25,
  developmentStage: 0.15,
  interests: 0.12,
  goals: 0.1,
  challenges: 0.1,
  weather: 0.08,
  weekday: 0.04,
  history: 0.07,
  parentMood: 0.05,
  nearbyEvents: 0.04,
} as const;

export type ScoringWeightKey = keyof typeof SCORING_WEIGHTS;
