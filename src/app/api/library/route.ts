import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { buildPlanContext, fetchLibraryArticles } from "@/lib/knowledge/repository";
import { fetchWeatherForLocation } from "@/lib/services/weather";
import { enrichProfileWithChildAge } from "@/lib/child-age";
import type { BriefProfile } from "@/lib/daily-brief-context";

/** Parenting library — DB-first, no AI generation */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      childNickname: true,
      childAge: true,
      childBirthday: true,
      parentingGoal: true,
      location: true,
    },
  });

  const profile = enrichProfileWithChildAge((user ?? {}) as BriefProfile) ?? ({} as BriefProfile);
  const weather = profile.location ? await fetchWeatherForLocation(profile.location) : null;
  const ctx = buildPlanContext(profile, weather?.weather ?? null);
  const recommendations = await fetchLibraryArticles(profile, ctx);

  return NextResponse.json({ recommendations, source: "knowledge_base" });
}
