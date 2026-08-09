import { NextResponse } from "next/server";
import { checkDatabaseConnection, prisma, withDbRetry } from "@/lib/db";

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
        error: connected.error,
        hint:
          "In Vercel → Production env, set DATABASE_URL to Neon pooled connection string with ?sslmode=require&connect_timeout=15. Wake project at console.neon.tech if suspended.",
      },
      { status: 503 }
    );
  }

  try {
    const userCount = await withDbRetry(() => prisma.user.count());
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
