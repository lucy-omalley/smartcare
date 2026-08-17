import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getQrRedirectPath } from "@/lib/posters/qr-links";
import { recordAdventureQrScan } from "@/lib/services/adventure-generator";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

/** Public endpoint for QR scan pages — returns redirect target */
export async function GET(request: Request, { params }: RouteContext) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target");

  const record = await prisma.routinePoster.findFirst({
    where: { id: params.id, deletedAt: null },
  });

  if (!record) {
    return NextResponse.json({ path: "/today" }, { status: 404 });
  }

  await recordAdventureQrScan(params.id);

  let qrTarget = record.qrTarget;
  if (target === "story") qrTarget = "TODAY_STORY";
  else if (target === "song") qrTarget = "TODAY_SONG";
  else if (target === "plan") qrTarget = "TODAY_PLAN";

  return NextResponse.json({
    path: getQrRedirectPath(qrTarget, params.id),
    qrTarget,
  });
}
