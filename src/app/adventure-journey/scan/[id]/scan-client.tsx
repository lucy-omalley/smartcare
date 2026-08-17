'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export function AdventureScanClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const target = searchParams.get('target');

  useEffect(() => {
    trackEvent('adventure_qr_scanned', { adventureId: id, target: target ?? 'plan' });
    trackEvent('poster_qr_scanned', { posterId: id, target: target ?? 'plan' });

    const query = target ? `?target=${target}` : '';
    fetch(`/api/posters/scan/${id}/info${query}`)
      .then((r) => r.json())
      .then((data) => {
        router.replace(data.path ?? '/today');
      })
      .catch(() => {
        router.replace('/today');
      });
  }, [id, target, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Opening your adventure…</p>
    </div>
  );
}
