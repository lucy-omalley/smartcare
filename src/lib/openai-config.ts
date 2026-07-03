/** Default chat model — override with OPENAI_MODEL in Vercel env */
const DEFAULT_MODEL = "gpt-4o-mini";

/** Retired OpenAI model IDs that should fall back to DEFAULT_MODEL */
const RETIRED_MODELS = new Set([
  "gpt-4-turbo-preview",
  "gpt-4-turbo",
  "gpt-4-32k",
  "gpt-4-32k-0314",
  "gpt-4-32k-0613",
  "gpt-3.5-turbo-0301",
  "gpt-3.5-turbo-0613",
]);

function resolveOpenAIModel(): string {
  const configured = process.env.OPENAI_MODEL?.trim();
  if (!configured || RETIRED_MODELS.has(configured)) {
    if (configured && RETIRED_MODELS.has(configured)) {
      console.warn(`OPENAI_MODEL "${configured}" is retired; using ${DEFAULT_MODEL} instead.`);
    }
    return DEFAULT_MODEL;
  }
  return configured;
}

export const OPENAI_MODEL = resolveOpenAIModel();

export const OPENAI_TEMPERATURE = parseFloat(process.env.OPENAI_TEMPERATURE || "0.7");

export const OPENAI_MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || "1000", 10);
