import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export function matchesAdminEmail(email?: string | null): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || !email) return false;
  return email.trim().toLowerCase() === adminEmail;
}

/** Admin users bypass free-tier chat, plan, and AI usage limits. */
export async function hasUnlimitedUsage(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, email: true },
  });
  if (!user) return false;
  return user.isAdmin || matchesAdminEmail(user.email);
}

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false as const, status: 401, error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, email: true },
  });

  const allowed = user?.isAdmin || matchesAdminEmail(session.user.email);
  if (!allowed) return { ok: false as const, status: 403, error: "Forbidden" };

  return { ok: true as const, userId: session.user.id };
}
