import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false as const, status: 401, error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, email: true },
  });

  const allowed = user?.isAdmin || session.user.email === process.env.ADMIN_EMAIL;
  if (!allowed) return { ok: false as const, status: 403, error: "Forbidden" };

  return { ok: true as const, userId: session.user.id };
}
