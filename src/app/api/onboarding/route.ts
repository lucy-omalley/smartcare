import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

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

  return NextResponse.json({ profile: user });
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
  } = body;

  const goals = parentingGoals ?? (parentingGoal ? [parentingGoal] : undefined);

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name && { name: name.trim() }),
      ...(childNickname !== undefined && { childNickname: childNickname?.trim() || null }),
      ...(childAge !== undefined && { childAge: childAge?.trim() || null }),
      ...(childBirthday !== undefined && { childBirthday: childBirthday?.trim() || null }),
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
      onboardingComplete: onboardingComplete ?? true,
    },
    select: profileSelect,
  });

  return NextResponse.json({ profile: user });
}

export async function PATCH(request: Request) {
  return POST(request);
}
