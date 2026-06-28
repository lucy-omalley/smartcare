import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { ExchangeCategory } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as ExchangeCategory | null;

  const listings = await prisma.exchangeListing.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ listings });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, title, description, condition, location, photoUrl } = await request.json();

  if (!category || !title?.trim() || !condition?.trim() || !location?.trim()) {
    return NextResponse.json({ error: "Category, title, condition, and location are required" }, { status: 400 });
  }

  const listing = await prisma.exchangeListing.create({
    data: {
      userId: session.user.id,
      category: category as ExchangeCategory,
      title: title.trim(),
      description: description?.trim() || "",
      condition: condition.trim(),
      location: location.trim(),
      photoUrl: photoUrl || null,
    },
  });

  return NextResponse.json({ listing });
}
