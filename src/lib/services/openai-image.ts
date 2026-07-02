import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GPT_IMAGE_MODELS = ["gpt-image-1", "gpt-image-1-mini"] as const;
const LEGACY_IMAGE_MODELS = ["dall-e-3", "dall-e-2"] as const;

function isGptImageModel(model: string): boolean {
  return model.startsWith("gpt-image");
}

async function urlToDataUrl(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const mime = response.headers.get("content-type") || "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function b64ToDataUrl(b64: string, format = "png"): string {
  return `data:image/${format};base64,${b64}`;
}

function buildModelList(): string[] {
  const preferred = process.env.OPENAI_IMAGE_MODEL?.trim();
  const defaults = [...GPT_IMAGE_MODELS, ...LEGACY_IMAGE_MODELS];
  if (!preferred) return defaults;
  return [preferred, ...defaults.filter((m) => m !== preferred)];
}

export async function generateOpenAIImage(prompt: string): Promise<string> {
  const models = buildModelList();
  let lastError: unknown;

  for (const model of models) {
    try {
      const result = await openai.images.generate({
        model,
        prompt,
        size: "1024x1024",
        ...(isGptImageModel(model)
          ? { quality: "medium" as const, output_format: "png" as const }
          : model === "dall-e-3"
            ? { quality: "standard" as const }
            : {}),
        n: 1,
      });

      const item = result.data?.[0];
      if (item?.b64_json) {
        return b64ToDataUrl(item.b64_json, "png");
      }
      if (item?.url) {
        return urlToDataUrl(item.url);
      }

      throw new Error("No illustration generated");
    } catch (err) {
      lastError = err;
      console.warn(`Image generation failed with model "${model}":`, err);
    }
  }

  throw lastError ?? new Error("Image generation failed");
}
