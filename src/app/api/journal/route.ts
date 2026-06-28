import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateJournalEntry } from "@/lib/services/mumbot";
import { MemoryCategory } from "@prisma/client";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sentence } = await request.json();
  if (!sentence?.trim()) {
    return NextResponse.json({ error: "Please share what made you smile today." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, childNickname: true, childAge: true, parentingGoal: true },
  });

  const journalEntry = await generateJournalEntry(user ?? {}, sentence.trim());

  const memory = await prisma.familyMemory.create({
    data: {
      userId: session.user.id,
      content: journalEntry,
      category: MemoryCategory.JOURNAL,
    },
  });

  return NextResponse.json({ memory, journalEntry });
}
