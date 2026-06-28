import OpenAI from "openai";
import { ILLUSTRATION_STYLE } from "@/lib/illustration-style";
import type { DailyBriefContent } from "@/types/daily-brief";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateCardIllustration(sceneDescription: string): Promise<string> {
  const prompt = `${ILLUSTRATION_STYLE}. ${sceneDescription}`;

  const result = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    size: "1024x1024",
    quality: "standard",
    n: 1,
  });

  const imageUrl = result.data?.[0]?.url;
  if (!imageUrl) throw new Error("No illustration generated");

  const response = await fetch(imageUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const mime = response.headers.get("content-type") || "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function briefNeedsIllustrations(brief: DailyBriefContent): boolean {
  return (
    !brief.recipe.imageData ||
    !brief.play.imageData ||
    !brief.bedtimeStory.illustrationData ||
    !brief.tip.imageData ||
    !brief.developmentImage
  );
}

export function needsBriefIllustrations(brief: DailyBriefContent): boolean {
  return briefNeedsIllustrations(brief);
}

export async function enrichBriefWithIllustrations(
  brief: DailyBriefContent,
  childNickname?: string | null
): Promise<DailyBriefContent> {
  const hero = childNickname || "a happy child";
  const updated = { ...brief, recipe: { ...brief.recipe }, play: { ...brief.play }, tip: { ...brief.tip }, bedtimeStory: { ...brief.bedtimeStory } };

  const jobs: Promise<void>[] = [];

  if (!updated.recipe.imageData) {
    jobs.push(
      generateCardIllustration(
        `Beautiful overhead photo-style illustration of a healthy children's meal: ${updated.recipe.subtitle}. Colourful, appetising, family kitchen warmth.`
      ).then((img) => { updated.recipe.imageData = img; })
    );
  }

  if (!updated.play.imageData) {
    jobs.push(
      generateCardIllustration(
        `Joyful play scene for toddlers: "${updated.play.title}". ${updated.play.indoorOutdoor} activity, ${hero} playing happily with simple materials.`
      ).then((img) => { updated.play.imageData = img; })
    );
  }

  if (!updated.bedtimeStory.illustrationData) {
    jobs.push(
      generateCardIllustration(
        `Bedtime storybook cover featuring ${hero} as the hero. Title mood: "${updated.bedtimeStory.title}". Magical, cosy, starry night feeling.`
      ).then((img) => { updated.bedtimeStory.illustrationData = img; })
    );
  }

  if (!updated.developmentImage) {
    const domain = updated.development[0]?.domain ?? "Learning";
    jobs.push(
      generateCardIllustration(
        `Cute friendly illustration representing child development and ${domain}. ${hero} learning and growing, warm encouraging mood.`
      ).then((img) => { updated.developmentImage = img; })
    );
  }

  if (!updated.tip.imageData) {
    jobs.push(
      generateCardIllustration(
        `Warm inspirational parenting moment about ${updated.tip.topic}. Parent and ${hero} sharing a gentle loving connection, soft pastel quote-card feeling without any text.`
      ).then((img) => { updated.tip.imageData = img; })
    );
  }

  await Promise.all(jobs);
  return updated;
}

export async function generateSceneIllustration(
  type: "meetup" | "activity" | "memory",
  title: string,
  context?: string
): Promise<string> {
  const scenes: Record<string, string> = {
    meetup: `Sunny park café scene for parent coffee walk meetup: "${title}". ${context ?? ""} Friendly neighbourhood, prams, warm community vibe.`,
    activity: `Family weekend outing illustration: "${title}". ${context ?? ""} Joyful children and parents, local community event.`,
    memory: `Heartwarming family memory moment: "${title.slice(0, 120)}". ${context ?? ""} Tender, nostalgic, golden-hour warmth.`,
  };
  return generateCardIllustration(scenes[type]);
}
