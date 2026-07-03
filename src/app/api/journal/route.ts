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

  const body = await request.json();
  const { sentence, feeling, win, challenge } = body;

  let checkInSentence = sentence?.trim();
  if (!checkInSentence && feeling?.trim()) {
    const parts = [`Feeling: ${feeling.trim()}`];
    if (win?.trim()) parts.push(`Today's win: ${win.trim()}`);
    if (challenge?.trim()) parts.push(`Today's challenge: ${challenge.trim()}`);
    checkInSentence = parts.join(". ");
  }

  if (!checkInSentence) {
    return NextResponse.json({ error: "Please complete your check-in." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      childNickname: true,
      childAge: true,
      parentingGoal: true,
      parentingGoals: true,
      currentChallenges: true,
    },
  });

  const journalEntry = await generateJournalEntry(user ?? {}, checkInSentence);

  const memory = await prisma.familyMemory.create({
    data: {
      userId: session.user.id,
      content: journalEntry,
      category: MemoryCategory.JOURNAL,
    },
  });

  const encouragement = journalEntry.split(".").slice(-2).join(".").trim() || journalEntry;

  return NextResponse.json({ memory, journalEntry, encouragement });
}
