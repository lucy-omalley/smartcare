import OpenAI from "openai";
import { storyIllustrationPrompt } from "@/lib/illustration-prompts";
import { generateCardIllustration } from "@/lib/services/card-illustrations";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TTS_MAX_CHARS = 4096;

export async function generateStoryIllustration(
  title: string,
  storyExcerpt: string,
  childName?: string | null,
  moral?: string | null
): Promise<string> {
  const prompt = storyIllustrationPrompt(
    { title, story: storyExcerpt, lengthMinutes: 5, moral: moral ?? undefined },
    childName ?? "the child"
  );
  return generateCardIllustration(prompt);
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
