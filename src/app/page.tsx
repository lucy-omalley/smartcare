'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';
import { LandingPage } from '@/components/landing/landing-page';

export default function Home() {
  useEffect(() => {
    trackEvent('landing_page_viewed');
  }, []);

  return <LandingPage />;
}
