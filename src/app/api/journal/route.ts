import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateJournalEntry } from "@/lib/services/mumbot";
import { moodFromCheckIn } from "@/lib/intelligence/context/gather-parent-mood";
import { MemoryCategory } from "@prisma/client";
import { assertCanUseAI, recordAiGenerationUsed } from "@/lib/ai/usage";
import { mapAiRouteError } from "@/lib/ai/route-errors";
import { trackServerError } from "@/lib/analytics/server-errors";

const MAX_CHECKIN_LENGTH = 2000;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    if (checkInSentence.length > MAX_CHECKIN_LENGTH) {
      return NextResponse.json({ error: "Check-in is too long. Please shorten it." }, { status: 400 });
    }

    await assertCanUseAI(session.user.id);

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
    await recordAiGenerationUsed(session.user.id);

    const [, memory] = await prisma.$transaction([
      feeling?.trim()
        ? prisma.parentCheckIn.create({
            data: {
              userId: session.user.id,
              feeling: feeling.trim(),
              win: win?.trim() || null,
              challenge: challenge?.trim() || null,
              moodBand: moodFromCheckIn(feeling.trim(), win, challenge).moodBand,
            },
          })
        : prisma.parentCheckIn.create({
            data: {
              userId: session.user.id,
              feeling: checkInSentence.slice(0, 200),
              moodBand: moodFromCheckIn(checkInSentence).moodBand,
            },
          }),
      prisma.familyMemory.create({
        data: {
          userId: session.user.id,
          content: journalEntry,
          category: MemoryCategory.JOURNAL,
        },
      }),
    ]);

    const encouragement = journalEntry.split(".").slice(-2).join(".").trim() || journalEntry;

    return NextResponse.json({ memory, journalEntry, encouragement });
  } catch (error) {
    console.error("Journal API error:", error);
    const userId = session?.user?.id;
    await trackServerError("journal_ai", error, userId);
    const mapped = mapAiRouteError(error);
    return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}
