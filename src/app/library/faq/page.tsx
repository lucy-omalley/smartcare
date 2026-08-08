'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle } from 'lucide-react';

interface FaqItem {
  slug: string;
  question: string;
  answer: string;
  category: string;
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  useEffect(() => {
    fetch('/api/faq')
      .then((r) => r.json())
      .then((d) => setFaqs(d.faqs ?? []));
  }, []);

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center gap-3 pt-2">
          <Link href="/library">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <HelpCircle className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">FAQ</h1>
        </div>

        {faqs.map((faq) => (
          <Card key={faq.slug} className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{faq.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
