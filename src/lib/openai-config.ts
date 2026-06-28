/** Default chat model — override with OPENAI_MODEL in .env.local */
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export const OPENAI_TEMPERATURE = parseFloat(process.env.OPENAI_TEMPERATURE || "0.7");

export const OPENAI_MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || "1000", 10);
