'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CommunityRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'connect' || tab === 'chats') {
      router.replace('/connect');
    } else if (tab === 'meetups') {
      router.replace('/connect?tab=events');
    } else {
      router.replace('/connect');
    }
  }, [router, searchParams]);

  return null;
}

export default function CommunityRedirect() {
  return (
    <Suspense fallback={null}>
      <CommunityRedirectInner />
    </Suspense>
  );
}
