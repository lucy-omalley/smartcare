import { NextResponse } from "next/server";
import { requireAiSession, aiGuardErrorResponse } from "@/lib/auth/session-guards";
import { mapAiRouteError } from "@/lib/ai/route-errors";
import { generatePosterPdf } from "@/lib/posters/export-pdf";
import { getRoutinePoster, recordPosterPrint } from "@/lib/services/poster-generator";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function POST(request: Request, { params }: RouteContext) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  try {
    const poster = await getRoutinePoster(guard.userId, params.id);
    if (!poster) return NextResponse.json({ error: "Poster not found." }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const format = body.format === "png" ? "png" : "pdf";

    const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "");
    const pdfBytes = await generatePosterPdf(poster, baseUrl);

    await recordPosterPrint(guard.userId, params.id);
    await persistAnalyticsEvent(
      format === "pdf" ? "poster_printed" : "poster_downloaded",
      guard.userId,
      { posterId: params.id, format, layout: poster.layout }
    );

    const filename = `${poster.title.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const mapped = mapAiRouteError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
