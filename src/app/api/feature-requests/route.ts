import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { FeatureRequestStatus } from "@prisma/client";

export async function GET() {
  const requests = await prisma.featureRequest.findMany({
    orderBy: [{ status: "asc" }, { voteCount: "desc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      voteCount: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { title?: string; description?: string };
  const title = body.title?.trim();
  const description = body.description?.trim();

  if (!title || title.length < 4) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!description || description.length < 10) {
    return NextResponse.json({ error: "Please describe your idea" }, { status: 400 });
  }

  const created = await prisma.featureRequest.create({
    data: {
      title: title.slice(0, 120),
      description: description.slice(0, 2000),
      submitterId: session.user.id,
      status: FeatureRequestStatus.OPEN,
    },
  });

  const { persistAnalyticsEvent } = await import("@/lib/analytics/persist");
  await persistAnalyticsEvent("feature_request_submitted", session.user.id, { title: created.title });

  return NextResponse.json({ request: created }, { status: 201 });
}
