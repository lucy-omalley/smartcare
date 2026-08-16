import { NextResponse } from "next/server";
import { recordPosterQrScan } from "@/lib/services/poster-generator";
import { getQrRedirectPath } from "@/lib/posters/qr-links";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  const record = await prisma.routinePoster.findFirst({
    where: { id: params.id, deletedAt: null },
  });

  if (!record) {
    return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
  }

  await recordPosterQrScan(params.id);

  const path = getQrRedirectPath(record.qrTarget, params.id);
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return NextResponse.redirect(new URL(path, base));
}
