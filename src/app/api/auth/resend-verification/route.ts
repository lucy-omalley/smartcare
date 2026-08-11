import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { createAndSendVerificationEmail } from "@/lib/auth/email-verification";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const result = await createAndSendVerificationEmail(session.user.id, user.email);

  if (process.env.NODE_ENV === "development" && result.devVerifyUrl) {
    return NextResponse.json({
      ok: true,
      sent: false,
      devVerifyUrl: result.devVerifyUrl,
    });
  }

  if (!result.sent) {
    return NextResponse.json(
      { error: "Could not send verification email. Try again later." },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, sent: true });
}
