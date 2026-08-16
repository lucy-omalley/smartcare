'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export default function PosterScanPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  useEffect(() => {
    trackEvent('poster_qr_scanned', { posterId: params.id });

    fetch(`/api/posters/scan/${params.id}/info`)
      .then((r) => r.json())
      .then((data) => {
        router.replace(data.path ?? '/today');
      })
      .catch(() => {
        router.replace('/today');
      });
  }, [params.id, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Opening Parenfy…</p>
    </div>
  );
}
