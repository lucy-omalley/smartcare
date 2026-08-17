import "server-only";

import OpenAI from "openai";
import type { VisionProvider, VisionRequest, VisionResult } from "@/lib/ai/vision/types";
import { resolveModelForFeature } from "@/lib/ai/router";
import { logAIUsage, logAIRequest } from "@/lib/ai/usage";
import { assertUserCanUseAi } from "@/lib/ai/guards";

function createClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/** OpenAI multimodal chat — swap model via OPENAI_VISION_MODEL env */
export const openAiVisionProvider: VisionProvider = {
  id: "openai",
  async completeVision(request: VisionRequest): Promise<VisionResult> {
    const model =
      process.env.OPENAI_VISION_MODEL?.trim() ||
      resolveModelForFeature(request.feature).model;

    if (request.userId) {
      await assertUserCanUseAi(request.userId);
    }

    const dataUrl = request.imageBase64.startsWith("data:")
      ? request.imageBase64
      : `data:${request.mimeType};base64,${request.imageBase64}`;

    const client = createClient();
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: request.systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: request.userPrompt },
            { type: "image_url", image_url: { url: dataUrl, detail: "low" } },
          ],
        },
      ],
      max_tokens: request.maxTokens ?? 800,
      temperature: 0.2,
      ...(request.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
    });

    const content = completion.choices[0]?.message?.content ?? "";
    const promptTokens = completion.usage?.prompt_tokens ?? 0;
    const completionTokens = completion.usage?.completion_tokens ?? 0;
    const tier = resolveModelForFeature(request.feature).tier;
    const estimatedCostUsd =
      (promptTokens / 1_000_000) * (tier === "large" ? 2.5 : 0.15) +
      (completionTokens / 1_000_000) * (tier === "large" ? 10 : 0.6);

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

    return {
      content,
      model,
      provider: "openai",
      promptTokens,
      completionTokens,
      estimatedCostUsd,
    };
  },
};
