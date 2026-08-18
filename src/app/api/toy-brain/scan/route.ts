import { NextResponse } from "next/server";
import { requireAiSession, aiGuardErrorResponse } from "@/lib/auth/session-guards";
import { mapAiRouteError } from "@/lib/ai/route-errors";
import { scanToyPhoto } from "@/lib/services/toy-brain-generator";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

export async function POST(request: Request) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";

    let photoData: string;
    let mimeType: string;
    let useAi = true;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("photo");
      useAi = form.get("useAi") !== "false";
      if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: "Photo is required." }, { status: 400 });
      }
      mimeType = file.type || "image/jpeg";
      const buffer = Buffer.from(await file.arrayBuffer());
      if (buffer.length > 3_000_000) {
        return NextResponse.json(
          { error: "Photo is too large. Please take a new photo — the app will compress it automatically." },
          { status: 413 }
        );
      }
      photoData = `data:${mimeType};base64,${buffer.toString("base64")}`;
    } else {
      const body = await request.json();
      photoData = String(body.photoData ?? "");
      mimeType = String(body.mimeType ?? "image/jpeg");
      useAi = body.useAi !== false;
      if (!photoData) {
        return NextResponse.json({ error: "Photo is required." }, { status: 400 });
      }
      if (photoData.length > 4_000_000) {
        return NextResponse.json(
          { error: "Photo is still too large after upload. Try a closer crop or lower-resolution photo." },
          { status: 413 }
        );
      }
    }

    const toy = await scanToyPhoto({
      userId: guard.userId,
      photoData,
      mimeType,
      useAi,
    });

    await persistAnalyticsEvent("toy_brain_scanned", guard.userId, {
      toyId: toy.id,
      category: toy.category,
      confidence: toy.confidence,
      useAi,
    });

    return NextResponse.json({ toy });
  } catch (error) {
    const mapped = mapAiRouteError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
