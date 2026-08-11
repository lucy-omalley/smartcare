import "server-only";

import { UsageLimitError } from "@/lib/ai/usage";

/** User-facing copy for AI failures — never expose raw provider errors. */
export const AI_UNAVAILABLE_MESSAGE =
  "Something went wrong on our side. Please try again in a moment.";

export const AI_LIMIT_MESSAGE =
  "You've reached your AI usage limit for now. Try again tomorrow or upgrade your plan.";

export function mapAiRouteError(error: unknown): {
  message: string;
  code: string;
  status: number;
} {
  if (error instanceof UsageLimitError) {
    return { message: error.message, code: "USAGE_LIMIT", status: 429 };
  }

  const errMsg = error instanceof Error ? error.message : String(error);

  if (errMsg.includes("API key") || errMsg.includes("invalid_api_key")) {
    return {
      message: "AI is temporarily unavailable. Please try again later.",
      code: "AI_NOT_CONFIGURED",
      status: 503,
    };
  }

  if (errMsg.includes("quota") || errMsg.includes("billing")) {
    return {
      message: "AI is temporarily unavailable due to service limits. Please try again later.",
      code: "AI_QUOTA",
      status: 503,
    };
  }

  return { message: AI_UNAVAILABLE_MESSAGE, code: "AI_ERROR", status: 500 };
}
