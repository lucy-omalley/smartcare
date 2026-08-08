import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import type { KnowledgeArticleCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [articles, faqs] = await Promise.all([
    prisma.knowledgeArticle.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.knowledgeFaq.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);

  return NextResponse.json({ articles, faqs });
}

export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const kind = body.kind as "article" | "faq";

  if (kind === "faq") {
    const faq = await prisma.knowledgeFaq.create({
      data: {
        slug: body.slug,
        question: body.question,
        answer: body.answer,
        category: body.category ?? "General",
        sortOrder: body.sortOrder ?? 0,
        published: body.published ?? false,
      },
    });
    return NextResponse.json({ faq });
  }

  const article = await prisma.knowledgeArticle.create({
    data: {
      slug: body.slug,
      title: body.title,
      category: (body.category ?? "GENERAL") as KnowledgeArticleCategory,
      body: body.body,
      summary: body.summary,
      published: body.published ?? false,
      sortOrder: body.sortOrder ?? 0,
      tags: body.tags ?? [],
    },
  });
  return NextResponse.json({ article });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const kind = body.kind as "article" | "faq";
  const id = body.id as string;

  if (kind === "faq") {
    const faq = await prisma.knowledgeFaq.update({
      where: { id },
      data: {
        question: body.question,
        answer: body.answer,
        category: body.category,
        published: body.published,
        sortOrder: body.sortOrder,
      },
    });
    return NextResponse.json({ faq });
  }

  const article = await prisma.knowledgeArticle.update({
    where: { id },
    data: {
      title: body.title,
      body: body.body,
      summary: body.summary,
      category: body.category,
      published: body.published,
      sortOrder: body.sortOrder,
    },
  });
  return NextResponse.json({ article });
}
