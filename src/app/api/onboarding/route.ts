import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

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
      parentingGoal: true,
      location: true,
      onboardingComplete: true,
    },
  });

  return NextResponse.json({ profile: user });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, childNickname, childAge, parentingGoal, location } = await request.json();

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name && { name: name.trim() }),
      childNickname: childNickname?.trim() || null,
      childAge: childAge?.trim() || null,
      parentingGoal: parentingGoal?.trim() || null,
      location: location?.trim() || null,
      onboardingComplete: true,
    },
    select: {
      name: true,
      childNickname: true,
      childAge: true,
      parentingGoal: true,
      location: true,
      onboardingComplete: true,
    },
  });

  return NextResponse.json({ profile: user });
}
