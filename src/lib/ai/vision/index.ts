import "server-only";

import type { VisionProvider, VisionProviderId, VisionRequest, VisionResult } from "@/lib/ai/vision/types";
import { openAiVisionProvider } from "@/lib/ai/vision/openai-vision";

const PROVIDERS: Record<VisionProviderId, VisionProvider> = {
  openai: openAiVisionProvider,
  gemini: openAiVisionProvider, // future: swap implementation
  claude: openAiVisionProvider, // future: swap implementation
};

function resolveVisionProvider(): VisionProvider {
  const id = (process.env.VISION_PROVIDER?.trim().toLowerCase() ?? "openai") as VisionProviderId;
  return PROVIDERS[id] ?? openAiVisionProvider;
}

/** Provider-agnostic vision gateway — configure via VISION_PROVIDER env */
export async function completeVision(request: VisionRequest): Promise<VisionResult> {
  const provider = resolveVisionProvider();
  return provider.completeVision(request);
}
