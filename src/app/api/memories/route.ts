import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { MemoryCategory } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memories = await prisma.familyMemory.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ memories });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, category } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const memory = await prisma.familyMemory.create({
    data: {
      userId: session.user.id,
      content: content.trim(),
      category: (category as MemoryCategory) || MemoryCategory.PREFERENCE,
    },
  });

  return NextResponse.json({ memory });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.familyMemory.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
