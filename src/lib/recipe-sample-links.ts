import type { DailyBriefRecipe } from "@/types/daily-brief";
import { attachRecipeSampleLinks } from "@/lib/services/recipe-link-resolver";

/** @deprecated Use attachRecipeSampleLinks from recipe-link-resolver */
export async function withRecipeSampleLinks(recipe: DailyBriefRecipe): Promise<DailyBriefRecipe> {
  return attachRecipeSampleLinks(recipe);
}
