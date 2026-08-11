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
import { aiGuardErrorResponse, requireAiSession } from "@/lib/auth/session-guards";

const MAX_CHECKIN_LENGTH = 2000;

export async function POST(request: Request) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
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

    await assertCanUseAI(guard.userId);

    const user = await prisma.user.findUnique({
      where: { id: guard.userId },
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
    await recordAiGenerationUsed(guard.userId);

    const [, memory] = await prisma.$transaction([
      feeling?.trim()
        ? prisma.parentCheckIn.create({
            data: {
              userId: guard.userId,
              feeling: feeling.trim(),
              win: win?.trim() || null,
              challenge: challenge?.trim() || null,
              moodBand: moodFromCheckIn(feeling.trim(), win, challenge).moodBand,
            },
          })
        : prisma.parentCheckIn.create({
            data: {
              userId: guard.userId,
              feeling: checkInSentence.slice(0, 200),
              moodBand: moodFromCheckIn(checkInSentence).moodBand,
            },
          }),
      prisma.familyMemory.create({
        data: {
          userId: guard.userId,
          content: journalEntry,
          category: MemoryCategory.JOURNAL,
        },
      }),
    ]);

    const encouragement = journalEntry.split(".").slice(-2).join(".").trim() || journalEntry;

    return NextResponse.json({ memory, journalEntry, encouragement });
  } catch (error) {
    console.error("Journal API error:", error);
    const userId = guard.userId;
    await trackServerError("journal_ai", error, userId);
    const mapped = mapAiRouteError(error);
    return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}
