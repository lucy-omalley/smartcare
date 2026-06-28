import OpenAI from "openai";
import { ILLUSTRATION_STYLE } from "@/lib/illustration-style";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TTS_MAX_CHARS = 4096;

export async function generateStoryIllustration(
  title: string,
  storyExcerpt: string,
  childName?: string | null
): Promise<string> {
  const hero = childName || "a happy child";
  const prompt = `${ILLUSTRATION_STYLE}. Bedtime storybook cover featuring ${hero}. Scene inspired by "${title}". ${storyExcerpt.slice(0, 200)}. Magical, cosy starlight mood.`;

  const result = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    size: "1024x1024",
    quality: "standard",
    n: 1,
  });

  const imageUrl = result.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error("No illustration generated");
  }

  const response = await fetch(imageUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const mime = response.headers.get("content-type") || "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function generateStoryNarration(storyText: string): Promise<Buffer> {
  const input = storyText.trim().slice(0, TTS_MAX_CHARS);

  const speech = await openai.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input,
    response_format: "mp3",
  });

  return Buffer.from(await speech.arrayBuffer());
}
