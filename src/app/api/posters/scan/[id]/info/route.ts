import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getQrRedirectPath } from "@/lib/posters/qr-links";
import { recordPosterQrScan } from "@/lib/services/poster-generator";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

/** Public endpoint for QR scan pages — returns redirect target */
export async function GET(_request: Request, { params }: RouteContext) {
  const record = await prisma.routinePoster.findFirst({
    where: { id: params.id, deletedAt: null },
  });

  if (!record) {
    return NextResponse.json({ path: "/today" }, { status: 404 });
  }

  await recordPosterQrScan(params.id);

  return NextResponse.json({
    path: getQrRedirectPath(record.qrTarget, params.id),
    qrTarget: record.qrTarget,
  });
}
