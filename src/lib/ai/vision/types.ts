import type { AIFeature } from "@prisma/client";

export type VisionProviderId = "openai" | "gemini" | "claude";

export interface VisionRequest {
  feature: AIFeature;
  imageBase64: string;
  mimeType: string;
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
  userId?: string;
  maxTokens?: number;
}

export interface VisionResult {
  content: string;
  model: string;
  provider: VisionProviderId;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
}

export interface VisionProvider {
  id: VisionProviderId;
  completeVision(request: VisionRequest): Promise<VisionResult>;
}
