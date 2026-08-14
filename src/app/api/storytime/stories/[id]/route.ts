import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { requireAiSession } from "@/lib/auth/session-guards";
import {
  deleteFamilyStory,
  getFamilyStory,
  toggleStoryFavorite,
} from "@/lib/services/family-story-library";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const story = await getFamilyStory(session.user.id, params.id);
  if (!story) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ story });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await request.json();
  if (typeof body.isFavorite === "boolean") {
    await toggleStoryFavorite(guard.userId, params.id, body.isFavorite);
  }

  const story = await getFamilyStory(guard.userId, params.id);
  return NextResponse.json({ story });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAiSession();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  await deleteFamilyStory(guard.userId, params.id);
  return NextResponse.json({ ok: true });
}
