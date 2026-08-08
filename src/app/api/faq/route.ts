import { NextResponse } from "next/server";
import { fetchPublishedFaqs } from "@/lib/knowledge/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const faqs = await fetchPublishedFaqs();
  return NextResponse.json({ faqs });
}
