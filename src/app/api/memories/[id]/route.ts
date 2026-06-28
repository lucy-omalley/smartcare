import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { MemoryCategory } from "@prisma/client";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, category } = await request.json();

  const memory = await prisma.familyMemory.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: {
      ...(content && { content: content.trim() }),
      ...(category && { category: category as MemoryCategory }),
    },
  });

  if (memory.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.familyMemory.findUnique({ where: { id: params.id } });
  return NextResponse.json({ memory: updated });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.familyMemory.deleteMany({
    where: { id: params.id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
