'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Crown, Users } from 'lucide-react';

interface BillingStatus {
  planTier: string;
  subscriptionStatus: string | null;
  subscriptionPeriodEnd: string | null;
}

export default function BillingPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/billing/status')
        .then((r) => r.json())
        .then((d) => setBilling(d.billing ?? null));
    }
  }, [status]);

  async function checkout(plan: 'PREMIUM' | 'FAMILY') {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  const isPaid = billing?.planTier === 'PREMIUM' || billing?.planTier === 'FAMILY';

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center gap-3 pt-2">
          <Link href="/today">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Subscription</h1>
        </div>

        {searchParams.get('success') && (
          <p className="text-sm text-green-600 bg-green-50 rounded-xl p-3">Subscription updated successfully.</p>
        )}

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Current plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-2xl font-bold capitalize">{billing?.planTier?.toLowerCase() ?? 'Free'}</p>
            {billing?.subscriptionPeriodEnd && isPaid && (
              <p className="text-muted-foreground">
                Renews {new Date(billing.subscriptionPeriodEnd).toLocaleDateString()}
              </p>
            )}
            {isPaid && (
              <Button variant="outline" className="rounded-xl mt-2" onClick={openPortal} disabled={loading}>
                Manage subscription
              </Button>
            )}
          </CardContent>
        </Card>

        {!isPaid && (
          <>
            <Card className="rounded-2xl border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" /> Premium
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>Unlimited daily plans, chats, and AI generations for one child profile.</p>
                <Button className="rounded-xl w-full" onClick={() => checkout('PREMIUM')} disabled={loading}>
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" /> Family
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>Everything in Premium for up to four child profiles.</p>
                <Button variant="secondary" className="rounded-xl w-full" onClick={() => checkout('FAMILY')} disabled={loading}>
                  Upgrade to Family
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
