import type { AIFeature } from "@prisma/client";

export type AIModelTier = "fast" | "large";

export interface AICompletionRequest {
  feature: AIFeature;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  userId?: string;
  cacheKey?: string;
  cacheTtlSeconds?: number;
}

export interface AICompletionResult {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  cacheHit: boolean;
}

export const COST_DASHBOARD_TARGETS = {
  cacheHitRateMin: 0.7,
  cacheHitRateMax: 0.9,
  llmReachRateMax: 0.2,
} as const;

export const PLAN_LIMITS = {
  FREE: {
    dailyPlansPerDay: 1,
    chatsPerDay: 3,
    generationsPerMonth: 20,
    childProfiles: 1,
    familyStoriesPerMonth: 3,
  },
  PREMIUM: {
    dailyPlansPerDay: Infinity,
    chatsPerDay: Infinity,
    generationsPerMonth: Infinity,
    childProfiles: 1,
    familyStoriesPerMonth: Infinity,
  },
  FAMILY: {
    dailyPlansPerDay: Infinity,
    chatsPerDay: Infinity,
    generationsPerMonth: Infinity,
    childProfiles: 4,
    familyStoriesPerMonth: Infinity,
  },
} as const;

/** Approximate USD per 1M tokens — update when pricing changes */
export const MODEL_COST_PER_1M = {
  fast: { input: 0.15, output: 0.6 },
  large: { input: 2.5, output: 10.0 },
} as const;
