'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Article {
  title: string;
  body: string;
  summary: string | null;
  category: string;
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetch(`/api/articles/${params.slug}`)
      .then((r) => r.json())
      .then((d) => setArticle(d.article ?? null));
  }, [params.slug]);

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4">
        <Link href="/library">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        {article ? (
          <article className="space-y-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{article.category}</p>
            <h1 className="text-2xl font-bold">{article.title}</h1>
            {article.summary && <p className="text-muted-foreground">{article.summary}</p>}
            <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">{article.body}</div>
          </article>
        ) : (
          <p className="text-muted-foreground text-sm">Loading article…</p>
        )}
      </div>
    </AppShell>
  );
}
