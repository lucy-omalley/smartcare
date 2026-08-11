import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { isFounderAdmin } from "@/lib/admin";

/** Founder dashboard access: FOUNDER_ADMIN_EMAILS or User.isAdmin */
export async function requireFounderAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  if (isFounderAdmin(session.user.email)) {
    return { ok: true as const, userId: session.user.id, email: session.user.email };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const, userId: session.user.id, email: session.user.email };
}
