import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { attachRecipeSampleLinks } from "@/lib/services/recipe-link-resolver";
import { isGenericRecipeLink } from "@/lib/recipe-link-utils";
import type { DailyBriefRecipe } from "@/types/daily-brief";

export const maxDuration = 30;

/** Resolve exact YouTube video + recipe article links for a generated dish. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { recipe?: DailyBriefRecipe };
    const recipe = body.recipe;
    if (!recipe?.subtitle || !Array.isArray(recipe.ingredients)) {
      return NextResponse.json({ error: "Invalid recipe" }, { status: 400 });
    }

    const needsResolve =
      !recipe.sampleLinks?.length ||
      recipe.sampleLinks.some((link) => isGenericRecipeLink(link.url));

    if (!needsResolve) {
      return NextResponse.json({ sampleLinks: recipe.sampleLinks });
    }

    const updated = await attachRecipeSampleLinks(recipe);
    return NextResponse.json({ sampleLinks: updated.sampleLinks ?? [] });
  } catch (error) {
    console.error("Resolve recipe links error:", error);
    const message = error instanceof Error ? error.message : "Link resolution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
