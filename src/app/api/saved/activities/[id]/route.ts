import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const source = request.nextUrl.searchParams.get("source");

  if (source === "memory") {
    await prisma.familyMemory.deleteMany({
      where: { id: params.id, userId },
    });
  } else {
    await prisma.savedActivity.deleteMany({
      where: { id: params.id, userId },
    });
  }

  return NextResponse.json({ success: true });
}
