import "server-only";

import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { isEmailVerified } from "@/lib/auth/email-verification";
import {
  AiDisabledError,
  EmailNotVerifiedError,
  assertAiGenerationEnabled,
} from "@/lib/ai/guards";

export type AiSessionResult =
  | { ok: true; session: Session; userId: string }
  | { ok: false; status: number; error: string; code?: string };

export async function requireAiSession(): Promise<AiSessionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  try {
    await assertAiGenerationEnabled();
  } catch (error) {
    if (error instanceof AiDisabledError) {
      return { ok: false, status: 503, error: error.message, code: "AI_DISABLED" };
    }
    throw error;
  }

  if (session.user.emailVerified === true) {
    return { ok: true, session, userId: session.user.id };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true, isAdmin: true },
  });

  if (user && isEmailVerified(user)) {
    return { ok: true, session, userId: session.user.id };
  }

  return {
    ok: false,
    status: 403,
    error:
      "Please verify your email to use AI features. Check your inbox or resend from the verification page.",
    code: "EMAIL_NOT_VERIFIED",
  };
}

export function aiGuardErrorResponse(result: Extract<AiSessionResult, { ok: false }>) {
  return { error: result.error, code: result.code };
}
