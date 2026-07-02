import type {
  DailyBriefContent,
  DailyBriefDevelopment,
  DailyBriefPlay,
  DailyBriefRecipe,
  DailyBriefStory,
  DailyBriefTip,
} from "@/types/daily-brief";

export type IllustrationSection = "recipe" | "play" | "story" | "development" | "tip";

function truncate(text: string, max = 140): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export function recipeIllustrationPrompt(recipe: DailyBriefRecipe): string {
  const ingredients = recipe.ingredients.slice(0, 6).join(", ");
  const highlights = recipe.nutritionalHighlights?.slice(0, 3).join(", ");
  return [
    `Appetising children's meal illustration: "${recipe.subtitle}".`,
    `Show the finished dish clearly with these ingredients visible: ${ingredients}.`,
    highlights ? `Nutrition focus: ${highlights}.` : null,
    truncate(recipe.whyThisMeal),
    "Warm family kitchen, colourful and wholesome.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function playIllustrationPrompt(play: DailyBriefPlay, hero: string): string {
  const materials = play.materials.join(", ");
  const skills = play.skillsDeveloped.slice(0, 3).join(", ");
  const scene = play.instructions[0] ? truncate(play.instructions[0], 100) : play.title;
  return [
    `Play activity: "${play.title}" — ${play.indoorOutdoor} setting.`,
    `${hero} actively playing using ${materials}.`,
    `Scene shows: ${scene}.`,
    skills ? `Developing: ${skills}.` : null,
    `${play.durationMinutes}-minute joyful activity.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function storyIllustrationPrompt(story: DailyBriefStory, hero: string): string {
  return [
    `Bedtime storybook scene for "${story.title}".`,
    `${hero} as the main character in the story moment:`,
    truncate(story.story, 220),
    story.moral ? `Gentle moral: ${truncate(story.moral, 80)}.` : null,
    "Magical, cosy, starry night feeling.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function developmentIllustrationPrompt(items: DailyBriefDevelopment[], hero: string): string {
  const focus = items[0];
  if (!focus) {
    return `${hero} learning and growing with warm encouragement.`;
  }
  const secondary = items[1]?.domain;
  return [
    `Child development scene — ${focus.domain}.`,
    `${hero} ${truncate(focus.tryToday, 100)}.`,
    truncate(focus.insight),
    secondary ? `Also subtly suggesting ${secondary}.` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

export function tipIllustrationPrompt(tip: DailyBriefTip, hero: string): string {
  return [
    `Parenting moment about ${tip.topic}.`,
    truncate(tip.content, 160),
    `Loving parent and ${hero} sharing a gentle connection.`,
    "Soft pastel mood, no text or words in the image.",
  ].join(" ");
}

export function meetupIllustrationPrompt(title: string, context?: string): string {
  return `Sunny neighbourhood parent meetup: "${title}". ${context ?? ""} Friendly café or park walk, prams, warm community vibe.`;
}

export function activityIllustrationPrompt(title: string, context?: string): string {
  return `Family weekend outing: "${title}". ${context ?? ""} Joyful children and parents at a local community event.`;
}

export function buildBriefIllustrationPrompts(
  brief: DailyBriefContent,
  childNickname?: string | null
): Record<IllustrationSection, string> {
  const hero = childNickname || "a happy toddler";
  return {
    recipe: recipeIllustrationPrompt(brief.recipe),
    play: playIllustrationPrompt(brief.play, hero),
    story: storyIllustrationPrompt(brief.bedtimeStory, hero),
    development: developmentIllustrationPrompt(brief.development, hero),
    tip: tipIllustrationPrompt(brief.tip, hero),
  };
}
