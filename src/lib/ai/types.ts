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

export const PLAN_LIMITS = {
  FREE: {
    dailyPlansPerDay: 1,
    chatsPerDay: 3,
    generationsPerMonth: 20,
  },
  PREMIUM: {
    dailyPlansPerDay: Infinity,
    chatsPerDay: Infinity,
    generationsPerMonth: Infinity,
  },
  FAMILY: {
    dailyPlansPerDay: Infinity,
    chatsPerDay: Infinity,
    generationsPerMonth: Infinity,
  },
} as const;

/** Approximate USD per 1M tokens — update when pricing changes */
export const MODEL_COST_PER_1M = {
  fast: { input: 0.15, output: 0.6 },
  large: { input: 2.5, output: 10.0 },
} as const;
