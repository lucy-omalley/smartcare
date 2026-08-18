import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import {
  enrichProfileWithChildAge,
  formatChildAgeFromBirthday,
  isValidBirthdayISO,
} from "@/lib/child-age";
import { invalidateTodayPlan, warmTodayPlanInBackground } from "@/lib/services/daily-brief";
import { bodyAffectsTodayPlan } from "@/lib/today-plan-stale";
import { grantBetaTrial } from "@/lib/beta-trial";

const profileSelect = {
  name: true,
  childNickname: true,
  childAge: true,
  childBirthday: true,
  childInterests: true,
  foodPreferences: true,
  routineNotes: true,
  developmentNotes: true,
  parentingGoal: true,
  parentingGoals: true,
  priorityGoal: true,
  currentChallenges: true,
  location: true,
  broadArea: true,
  bio: true,
  interests: true,
  visibilityPreference: true,
  openToConnect: true,
  onboardingComplete: true,
  betaTrialEndsAt: true,
  favouriteAnimal: true,
  favouriteVehicle: true,
  favouriteCharacter: true,
  storyLearningTheme: true,
  storyMoralPreference: true,
  favouriteToys: true,
  preferredLocale: true,
} as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: profileSelect,
  });

  return NextResponse.json({ profile: enrichProfileWithChildAge(user) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    childNickname,
    childAge,
    childBirthday,
    childInterests,
    foodPreferences,
    routineNotes,
    developmentNotes,
    parentingGoal,
    parentingGoals,
    priorityGoal,
    currentChallenges,
    location,
    broadArea,
    bio,
    interests,
    visibilityPreference,
    openToConnect,
    onboardingComplete,
    favouriteAnimal,
    favouriteVehicle,
    favouriteCharacter,
    storyLearningTheme,
    storyMoralPreference,
    favouriteToys,
    preferredLocale,
  } = body;

  const goals = parentingGoals ?? (parentingGoal ? [parentingGoal] : undefined);

  let resolvedBirthday: string | null | undefined;
  let resolvedAge: string | null | undefined;

  if (childBirthday !== undefined) {
    const trimmed = childBirthday?.trim() || null;
    if (trimmed && !isValidBirthdayISO(trimmed)) {
      return NextResponse.json({ error: "Invalid date of birth" }, { status: 400 });
    }
    resolvedBirthday = trimmed;
    resolvedAge = trimmed ? formatChildAgeFromBirthday(trimmed) : null;
  } else if (childAge !== undefined) {
    resolvedAge = childAge?.trim() || null;
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name && { name: name.trim() }),
      ...(childNickname !== undefined && { childNickname: childNickname?.trim() || null }),
      ...(resolvedAge !== undefined && { childAge: resolvedAge }),
      ...(resolvedBirthday !== undefined && { childBirthday: resolvedBirthday }),
      ...(childInterests !== undefined && { childInterests: childInterests ?? [] }),
      ...(foodPreferences !== undefined && { foodPreferences: foodPreferences ?? [] }),
      ...(routineNotes !== undefined && { routineNotes: routineNotes?.trim() || null }),
      ...(developmentNotes !== undefined && { developmentNotes: developmentNotes?.trim() || null }),
      ...(goals !== undefined && {
        parentingGoals: goals,
        parentingGoal: goals[0] ?? null,
      }),
      ...(priorityGoal !== undefined && { priorityGoal: priorityGoal?.trim() || null }),
      ...(currentChallenges !== undefined && { currentChallenges: currentChallenges ?? [] }),
      ...(location !== undefined && { location: location?.trim() || null }),
      ...(broadArea !== undefined && { broadArea: broadArea?.trim() || null }),
      ...(bio !== undefined && { bio: bio?.trim() || null }),
      ...(interests !== undefined && { interests: interests ?? [] }),
      ...(visibilityPreference !== undefined && { visibilityPreference }),
      ...(openToConnect !== undefined && { openToConnect }),
      ...(favouriteAnimal !== undefined && { favouriteAnimal: favouriteAnimal?.trim() || null }),
      ...(favouriteVehicle !== undefined && { favouriteVehicle: favouriteVehicle?.trim() || null }),
      ...(favouriteCharacter !== undefined && { favouriteCharacter: favouriteCharacter?.trim() || null }),
      ...(storyLearningTheme !== undefined && { storyLearningTheme: storyLearningTheme?.trim() || null }),
      ...(storyMoralPreference !== undefined && { storyMoralPreference: storyMoralPreference?.trim() || null }),
      ...(favouriteToys !== undefined && { favouriteToys: favouriteToys ?? [] }),
      ...(preferredLocale !== undefined && {
        preferredLocale: preferredLocale === "zh-CN" ? "zh-CN" : "en",
      }),
      onboardingComplete: onboardingComplete ?? true,
    },
    select: profileSelect,
  });

  if (onboardingComplete) {
    await grantBetaTrial(session.user.id);
  }

  const planAffectingUpdate = bodyAffectsTodayPlan(body as Record<string, unknown>);
  let todayPlanRegenerated = false;
  if (planAffectingUpdate) {
    try {
      await invalidateTodayPlan(session.user.id);
      warmTodayPlanInBackground(session.user.id, "profile_refresh");
      todayPlanRegenerated = true;
    } catch (error) {
      console.error("Today plan refresh after profile update failed:", error);
      // Profile saved — still kick off regeneration so Today is not stuck empty.
      warmTodayPlanInBackground(session.user.id, "profile_refresh");
      todayPlanRegenerated = true;
    }
  }

  return NextResponse.json({
    profile: enrichProfileWithChildAge(user),
    todayPlanRegenerated,
  });
}

export async function PATCH(request: Request) {
  return POST(request);
}
