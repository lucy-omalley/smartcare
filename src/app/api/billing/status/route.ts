import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { effectivePlanTier, getBetaTrialStatus } from "@/lib/beta-trial";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      planTier: true,
      subscriptionStatus: true,
      subscriptionPeriodEnd: true,
      betaTrialEndsAt: true,
    },
  });

  const trial = user ? await getBetaTrialStatus(session.user.id) : null;

  return NextResponse.json({
    billing: user
      ? {
          ...user,
          effectivePlanTier: user ? effectivePlanTier(user) : "FREE",
        }
      : null,
    trial,
  });
}
