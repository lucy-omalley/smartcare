import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bio, interests, openToConnect } = await request.json();

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(bio !== undefined && { bio: bio?.trim() || null }),
      ...(Array.isArray(interests) && { interests }),
      ...(openToConnect !== undefined && { openToConnect: !!openToConnect }),
    },
    select: {
      name: true,
      childNickname: true,
      childAge: true,
      parentingGoal: true,
      location: true,
      bio: true,
      interests: true,
      openToConnect: true,
      onboardingComplete: true,
    },
  });

  return NextResponse.json({ profile: user });
}
