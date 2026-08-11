import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { fetchRotateContext, getOrCreateDailyBrief, updateDailyBriefSection } from "@/lib/services/daily-brief";
import { generateRecipeFromFridge } from "@/lib/services/mumbot";
import { warmTodayRecipeIllustration } from "@/lib/services/today-page";
import type { DailyBriefRecipe } from "@/types/daily-brief";
import { assertCanUseAI, recordAiGenerationUsed } from "@/lib/ai/usage";
import { mapAiRouteError } from "@/lib/ai/route-errors";
import { trackServerError } from "@/lib/analytics/server-errors";
import { aiGuardErrorResponse, requireAiSession } from "@/lib/auth/session-guards";

export const maxDuration = 60;

const MAX_INGREDIENTS = 30;
const MAX_ITEM_LENGTH = 80;

function parseStringList(raw: unknown): string[] {
  return (Array.isArray(raw) ? raw : [])
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, MAX_ITEM_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_INGREDIENTS);
}

/** Generate a personalised recipe from fridge ingredients the parent has on hand. */
export async function POST(request: Request) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
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

    await assertCanUseAI(guard.userId);

    const { profile, memories } = await fetchRotateContext(guard.userId);
    let avoidRecipe: DailyBriefRecipe | undefined;
    if (body.tryAnother) {
      const brief = await getOrCreateDailyBrief(guard.userId);
      avoidRecipe = brief.recipe;
    }

    const recipe = await generateRecipeFromFridge(profile, memories, ingredients, {
      mealPreferences,
      avoidRecipe,
    });
    delete recipe.imageData;

    await recordAiGenerationUsed(guard.userId);

    const { brief } = await updateDailyBriefSection(guard.userId, "recipe", recipe);
    warmTodayRecipeIllustration(guard.userId);

    return NextResponse.json({ brief, recipe });
  } catch (error) {
    console.error("Fridge meal error:", error);
    const userId = guard.userId;
    await trackServerError("fridge_meal_ai", error, userId);
    const mapped = mapAiRouteError(error);
    return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}
