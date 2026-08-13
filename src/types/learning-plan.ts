export interface LearningPlanActivity {
  title: string;
  durationMinutes: number;
  materials: string[];
  steps: string[];
}

export interface LearningPlanContent {
  learningObjective: string;
  activities: LearningPlanActivity[];
  parentGuidance: string;
  questionsToAsk: string[];
  extensionActivity: string;
  reflectionPrompt: string;
}

export interface WeeklyGrowthReportContent {
  winsThisWeek: string;
  skillsPracticed: string[];
  developmentProgress: string;
  suggestedFocus: string;
  recommendedActivities: string[];
  nextWeekGoals: string[];
  encouragement: string;
}
