import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { fetchRotateContext, getOrCreateDailyBrief, updateDailyBriefSection } from "@/lib/services/daily-brief";
import { generateRecipeFromFridge } from "@/lib/services/mumbot";
import { warmTodayRecipeIllustration } from "@/lib/services/today-page";
import type { DailyBriefRecipe } from "@/types/daily-brief";

export const maxDuration = 60;

function parseStringList(raw: unknown): string[] {
  return (Array.isArray(raw) ? raw : [])
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Generate a personalised recipe from fridge ingredients the parent has on hand. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      ingredients?: unknown;
      mealPreferences?: unknown;
      tryAnother?: boolean;
    };

    const ingredients = parseStringList(body.ingredients);
    const mealPreferences = parseStringList(body.mealPreferences);

    if (ingredients.length === 0) {
      return NextResponse.json({ error: "Add at least one ingredient" }, { status: 400 });
    }

    const { profile, memories } = await fetchRotateContext(session.user.id);
    let avoidRecipe: DailyBriefRecipe | undefined;
    if (body.tryAnother) {
      const brief = await getOrCreateDailyBrief(session.user.id);
      avoidRecipe = brief.recipe;
    }

    const recipe = await generateRecipeFromFridge(profile, memories, ingredients, {
      mealPreferences,
      avoidRecipe,
    });
    delete recipe.imageData;

    const { brief } = await updateDailyBriefSection(session.user.id, "recipe", recipe);
    warmTodayRecipeIllustration(session.user.id);

    return NextResponse.json({ brief, recipe });
  } catch (error) {
    console.error("Fridge meal error:", error);
    const message = error instanceof Error ? error.message : "Meal generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
