import { ILLUSTRATION_STYLE } from "@/lib/illustration-style";
import {
  buildBriefIllustrationPrompts,
  type IllustrationSection,
  meetupIllustrationPrompt,
  activityIllustrationPrompt,
} from "@/lib/illustration-prompts";
import { generateOpenAIImage } from "@/lib/services/openai-image";
import type { DailyBriefContent } from "@/types/daily-brief";

const ALL_SECTIONS: IllustrationSection[] = ["recipe", "play", "story", "development", "tip"];

export type { IllustrationSection };

export async function generateCardIllustration(sceneDescription: string): Promise<string> {
  const prompt = `${ILLUSTRATION_STYLE}. ${sceneDescription}`;
  return generateOpenAIImage(prompt);
}

function sectionNeedsImage(brief: DailyBriefContent, section: IllustrationSection): boolean {
  switch (section) {
    case "recipe":
      return !brief.recipe.imageData;
    case "play":
      return !brief.play.imageData;
    case "story":
      return !brief.bedtimeStory.illustrationData;
    case "development":
      return !brief.developmentImage;
    case "tip":
      return !brief.tip.imageData;
  }
}

function briefNeedsIllustrations(brief: DailyBriefContent): boolean {
  return ALL_SECTIONS.some((section) => sectionNeedsImage(brief, section));
}

export function needsBriefIllustrations(brief: DailyBriefContent): boolean {
  return briefNeedsIllustrations(brief);
}

export function clearBriefIllustration(
  brief: DailyBriefContent,
  section: IllustrationSection
): DailyBriefContent {
  const updated = {
    ...brief,
    recipe: { ...brief.recipe },
    play: { ...brief.play },
    tip: { ...brief.tip },
    bedtimeStory: { ...brief.bedtimeStory },
  };

  switch (section) {
    case "recipe":
      delete updated.recipe.imageData;
      break;
    case "play":
      delete updated.play.imageData;
      break;
    case "story":
      delete updated.bedtimeStory.illustrationData;
      break;
    case "development":
      delete updated.developmentImage;
      break;
    case "tip":
      delete updated.tip.imageData;
      break;
  }

  return updated;
}

async function applySectionIllustration(
  brief: DailyBriefContent,
  section: IllustrationSection,
  imageData: string
): Promise<void> {
  switch (section) {
    case "recipe":
      brief.recipe.imageData = imageData;
      break;
    case "play":
      brief.play.imageData = imageData;
      break;
    case "story":
      brief.bedtimeStory.illustrationData = imageData;
      break;
    case "development":
      brief.developmentImage = imageData;
      break;
    case "tip":
      brief.tip.imageData = imageData;
      break;
  }
}

export async function enrichBriefWithIllustrations(
  brief: DailyBriefContent,
  childNickname?: string | null,
  sections: IllustrationSection[] = ALL_SECTIONS
): Promise<DailyBriefContent> {
  const updated = {
    ...brief,
    recipe: { ...brief.recipe },
    play: { ...brief.play },
    tip: { ...brief.tip },
    bedtimeStory: { ...brief.bedtimeStory },
  };

  const prompts = buildBriefIllustrationPrompts(updated, childNickname);
  const jobs: Promise<void>[] = [];

  for (const section of sections) {
    if (!sectionNeedsImage(updated, section)) continue;

    jobs.push(
      generateCardIllustration(prompts[section]).then((img) =>
        applySectionIllustration(updated, section, img)
      )
    );
  }

  await Promise.allSettled(jobs);
  return updated;
}

export async function generateSceneIllustration(
  type: "meetup" | "activity" | "memory",
  title: string,
  context?: string
): Promise<string> {
  const scenes: Record<string, string> = {
    meetup: meetupIllustrationPrompt(title, context),
    activity: activityIllustrationPrompt(title, context),
    memory: `Heartwarming family memory: "${title.slice(0, 120)}". ${context ?? ""} Tender, nostalgic, golden-hour warmth.`,
  };
  return generateCardIllustration(scenes[type]);
}
