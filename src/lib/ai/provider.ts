import "server-only";

import OpenAI from "openai";
import type { AIFeature } from "@prisma/client";
import { getCachedAIResponse, setCachedAIResponse } from "@/lib/ai/cache";
import { resolveModelForFeature } from "@/lib/ai/router";
import { logAIUsage, logAIRequest } from "@/lib/ai/usage";
import { assertUserCanUseAi, AiDisabledError, EmailNotVerifiedError } from "@/lib/ai/guards";
import type { AICompletionRequest, AICompletionResult } from "@/lib/ai/types";

/**
 * Provider-agnostic AI gateway. Replace OpenAI client here to swap LLM vendors.
 */
function createProviderClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const MAX_PROMPT_CHARS = 8000;
const MAX_HISTORY_MESSAGES = 12;

export function truncatePrompt(text: string, max = MAX_PROMPT_CHARS): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

export function limitChatHistory<T>(messages: T[], max = MAX_HISTORY_MESSAGES): T[] {
  return messages.slice(-max);
}

export async function completeAI(request: AICompletionRequest): Promise<AICompletionResult> {
  const { model, tier } = resolveModelForFeature(request.feature);

  if (request.cacheKey) {
    const cached = await getCachedAIResponse<{ content: string }>(request.cacheKey);
    if (cached?.content) {
      await logAIUsage({
        userId: request.userId,
        feature: request.feature,
        model,
        tier,
        promptTokens: 0,
        completionTokens: 0,
        cacheHit: true,
      });
      await logAIRequest({
        userId: request.userId,
        feature: request.feature,
        resolution: "CACHE_HIT",
      });
      return {
        content: cached.content,
        model,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: 0,
        cacheHit: true,
      };
    }
  }

  if (request.userId) {
    await assertUserCanUseAi(request.userId);
  }

  const client = createProviderClient();
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: request.systemPrompt },
      { role: "user", content: truncatePrompt(request.userPrompt) },
    ],
    temperature: request.temperature ?? 0.7,
    max_tokens: request.maxTokens ?? 400,
    ...(request.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const promptTokens = completion.usage?.prompt_tokens ?? 0;
  const completionTokens = completion.usage?.completion_tokens ?? 0;
  const estimatedCostUsd =
    (promptTokens / 1_000_000) * (tier === "large" ? 2.5 : 0.15) +
    (completionTokens / 1_000_000) * (tier === "large" ? 10 : 0.6);

  if (request.cacheKey && content) {
    await setCachedAIResponse(
      request.cacheKey,
      request.feature,
      { content },
      request.cacheTtlSeconds ?? 86400
    );
  }

  await logAIUsage({
    userId: request.userId,
    feature: request.feature,
    model,
    tier,
    promptTokens,
    completionTokens,
    cacheHit: false,
  });
  await logAIRequest({
    userId: request.userId,
    feature: request.feature,
    resolution: "LLM",
  });

  return { content, model, promptTokens, completionTokens, estimatedCostUsd, cacheHit: false };
}
