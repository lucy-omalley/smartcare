import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Public health check for database connectivity (no secrets exposed).
 * Use after deploy to verify DATABASE_URL on Vercel runtime.
 */
export async function GET() {
  const connected = await checkDatabaseConnection();
  if (!connected.ok) {
    return NextResponse.json(
      {
        ok: false,
        database: "unreachable",
        hint: "Check DATABASE_URL in Vercel Production env vars and Neon project status.",
      },
      { status: 503 }
    );
  }

  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      database: "connected",
      userCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "connected_but_query_failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
