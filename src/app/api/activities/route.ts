import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { ActivityCategory } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as ActivityCategory | null;

  const activities = await prisma.activity.findMany({
    where: {
      date: { gte: new Date() },
      ...(category && { category }),
    },
    orderBy: { date: "asc" },
    take: 50,
  });

  return NextResponse.json({ activities });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, category, date, location } = await request.json();

  if (!title?.trim() || !date || !location?.trim()) {
    return NextResponse.json({ error: "Title, date, and location are required" }, { status: 400 });
  }

  const activity = await prisma.activity.create({
    data: {
      userId: session.user.id,
      title: title.trim(),
      description: description?.trim() || "",
      category: (category as ActivityCategory) || ActivityCategory.OTHER,
      date: new Date(date),
      location: location.trim(),
    },
  });

  return NextResponse.json({ activity });
}
