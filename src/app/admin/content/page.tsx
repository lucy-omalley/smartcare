'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FaqItem {
  id: string;
  slug: string;
  question: string;
  answer: string;
  category: string;
  published: boolean;
}

interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  published: boolean;
  sortOrder: number;
}

interface FaqDraft {
  slug: string;
  question: string;
  answer: string;
  category: string;
}

export default function AdminContentPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<FaqDraft>({
    slug: '',
    question: '',
    answer: '',
    category: 'General',
  });

  function load() {
    fetch('/api/admin/content')
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
        return res.json();
      })
      .then((data) => {
        setFaqs(data.faqs ?? []);
        setArticles(data.articles ?? []);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function createFaq() {
    await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'faq', ...draft, published: true }),
    });
    setDraft({ slug: '', question: '', answer: '', category: 'General' });
    load();
  }

  async function toggleFaqPublished(faq: FaqItem) {
    await fetch('/api/admin/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'faq', id: faq.id, published: !faq.published }),
    });
    load();
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content CMS</h1>
          <p className="text-sm text-muted-foreground">Manage FAQ and articles</p>
        </div>
        <Link href="/admin/costs">
          <Button variant="outline" size="sm">Cost dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add FAQ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="slug (e.g. what-is-parenfy)"
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
          />
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Question"
            value={draft.question}
            onChange={(e) => setDraft({ ...draft, question: e.target.value })}
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]"
            placeholder="Answer"
            value={draft.answer}
            onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
          />
          <Button size="sm" onClick={createFaq} disabled={!draft.slug || !draft.question}>
            Publish FAQ
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">FAQs ({faqs.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {faqs.map((faq) => (
            <div key={faq.id} className="flex justify-between gap-4 border-b pb-2">
              <div>
                <p className="font-medium">{faq.question}</p>
                <p className="text-muted-foreground line-clamp-2">{faq.answer}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toggleFaqPublished(faq)}>
                {faq.published ? 'Unpublish' : 'Publish'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Articles ({articles.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {articles.map((a) => (
            <div key={a.id} className="flex justify-between">
              <Link href={`/library/articles/${a.slug}`} className="text-primary hover:underline">
                {a.title}
              </Link>
              <span className="text-muted-foreground">{a.published ? 'Published' : 'Draft'}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
