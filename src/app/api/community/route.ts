import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { PostType } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as PostType | null;

  const posts = await prisma.communityPost.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true } } },
  });

  const sanitized = posts.map((p) => ({
    ...p,
    authorName: p.isAnonymous ? "Anonymous Parent" : p.user.name?.split(" ")[0] || "Parent",
    user: undefined,
  }));

  return NextResponse.json({ posts: sanitized });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, title, content, isAnonymous } = await request.json();

  if (!type || !title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Type, title, and content are required" }, { status: 400 });
  }

  const post = await prisma.communityPost.create({
    data: {
      userId: session.user.id,
      type: type as PostType,
      title: title.trim(),
      content: content.trim(),
      isAnonymous: isAnonymous ?? false,
    },
  });

  return NextResponse.json({ post });
}
