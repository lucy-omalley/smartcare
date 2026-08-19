export type ActivationScoreInput = {
  onboardingComplete: boolean;
  hasTodaysJourney: boolean;
  openedHeroFeature: boolean;
  completedHeroFeature: boolean;
  returnedWithin7Days: boolean;
};

export type ActivationScore = {
  score: number;
  max: 100;
  breakdown: Array<{ label: string; points: number; earned: boolean }>;
};

const CRITERIA = [
  { key: "onboardingComplete" as const, label: "Completed onboarding", points: 20 },
  { key: "hasTodaysJourney" as const, label: "Generated Today's Journey", points: 20 },
  { key: "openedHeroFeature" as const, label: "Opened hero feature", points: 20 },
  { key: "completedHeroFeature" as const, label: "Completed hero feature", points: 20 },
  { key: "returnedWithin7Days" as const, label: "Returned within 7 days", points: 20 },
];

export function computeActivationScore(input: ActivationScoreInput): ActivationScore {
  let score = 0;
  const breakdown = CRITERIA.map(({ key, label, points }) => {
    const earned = Boolean(input[key]);
    if (earned) score += points;
    return { label, points, earned };
  });
  return { score, max: 100, breakdown };
}
