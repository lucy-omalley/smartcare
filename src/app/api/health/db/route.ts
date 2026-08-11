import { NextResponse } from "next/server";
import { checkDatabaseConnection, prisma, withDbRetry } from "@/lib/db";

export const dynamic = "force-dynamic";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Database connectivity check.
 * Production responses omit user counts and internal error strings.
 */
export async function GET() {
  const connected = await checkDatabaseConnection();
  if (!connected.ok) {
    return NextResponse.json(
      {
        ok: false,
        database: "unreachable",
        ...(isProduction
          ? {}
          : {
              error: connected.error,
              hint: "Check DATABASE_URL (Neon pooled URL with ?sslmode=require).",
            }),
      },
      { status: 503 }
    );
  }

  if (isProduction) {
    return NextResponse.json({ ok: true, database: "connected" });
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
