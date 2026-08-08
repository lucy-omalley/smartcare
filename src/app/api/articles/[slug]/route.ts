import { NextResponse } from "next/server";
import { fetchArticleBySlug } from "@/lib/knowledge/repository";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const article = await fetchArticleBySlug(params.slug);
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ article });
}
