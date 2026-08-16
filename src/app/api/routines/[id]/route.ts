import { NextResponse } from "next/server";
import { requireAiSession, aiGuardErrorResponse } from "@/lib/auth/session-guards";
import { getVisualRoutine, deleteVisualRoutine, toggleRoutineFavorite } from "@/lib/services/routine-generator";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  const routine = await getVisualRoutine(guard.userId, params.id);
  if (!routine) {
    return NextResponse.json({ error: "Routine not found" }, { status: 404 });
  }
  return NextResponse.json({ routine });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  const body = await request.json();
  if (typeof body.isFavorite === "boolean") {
    const routine = await toggleRoutineFavorite(guard.userId, params.id, body.isFavorite);
    return NextResponse.json({ routine });
  }
  return NextResponse.json({ error: "Invalid update" }, { status: 400 });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json(aiGuardErrorResponse(guard), { status: guard.status });
  }

  await deleteVisualRoutine(guard.userId, params.id);
  return NextResponse.json({ ok: true });
}
