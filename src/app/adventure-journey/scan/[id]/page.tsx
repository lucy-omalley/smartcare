import { Suspense } from 'react';
import { AdventureScanClient } from './scan-client';

export default function AdventureScanPage({ params }: { params: { id: string } }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6">
          <p className="text-sm text-muted-foreground">Opening your adventure…</p>
        </div>
      }
    >
      <AdventureScanClient id={params.id} />
    </Suspense>
  );
}
