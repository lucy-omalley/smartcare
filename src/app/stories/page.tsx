'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Mic, Sparkles, Library, Crown, ArrowRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { VoiceUsageSummary } from '@/components/storytime/voice-usage-summary';
import type { VoiceUsageSnapshot } from '@/types/voice-usage';
import { useTranslation } from '@/hooks/use-translation';

interface StorytimeFeatures {
  isPremium: boolean;
  familyVoiceEnabled: boolean;
  storiesRemainingThisMonth: number | null;
  voiceUsage?: VoiceUsageSnapshot | null;
}

export default function StoriesHubPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [features, setFeatures] = useState<StorytimeFeatures | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/storytime/features')
        .then((r) => r.json())
        .then((d) => setFeatures(d.features))
        .catch(() => {});
      trackEvent('feature_used', { feature: 'Stories' });
    }
  }, [status, router]);

  const cards = [
    {
      href: '/stories/voice',
      emoji: '🎙️',
      title: t('stories.recordVoice'),
      desc: t('stories.subtitle'),
      icon: Mic,
      premium: true,
      highlight: true,
    },
    {
      href: '/stories/create',
      emoji: '✨',
      title: t('stories.createStory'),
      desc: t('stories.generate'),
      icon: Sparkles,
      premium: false,
    },
    {
      href: '/stories/history',
      emoji: '📚',
      title: t('stories.storyLibrary'),
      desc: t('stories.play'),
      icon: Library,
      premium: false,
    },
  ];

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-5 pb-24">
        <header className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{t('stories.name')}</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{t('stories.headline')}</p>
          {features && !features.isPremium && features.storiesRemainingThisMonth !== null && (
            <Badge variant="secondary" className="rounded-full">
              {features.storiesRemainingThisMonth} free stories left this month
            </Badge>
          )}
          {features?.isPremium && (
            <Badge className="rounded-full gap-1">
              <Crown className="h-3 w-3" /> Premium active
            </Badge>
          )}
        </header>

        {features?.voiceUsage && <VoiceUsageSummary usage={features.voiceUsage} />}

        <div className="space-y-3">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className={`rounded-2xl hover:border-primary/40 transition-colors ${card.highlight ? 'border-violet-200 bg-gradient-to-br from-violet-50/80 to-background dark:from-violet-950/20' : ''}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>{card.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm flex items-center gap-2">
                      {card.title}
                      {card.highlight && (
                        <Badge className="text-[9px] rounded-full">Signature</Badge>
                      )}
                      {card.premium && !features?.familyVoiceEnabled && (
                        <Badge variant="outline" className="text-[9px] rounded-full">Premium</Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{card.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {!features?.isPremium && (
          <Card className="rounded-2xl border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-medium">Unlock the full experience</p>
              <p className="text-xs text-muted-foreground">
                Unlimited stories, family voice narration, longer tales, and weekly story collections.
              </p>
              <Button asChild className="rounded-xl w-full" size="sm">
                <Link href="/billing">Upgrade to Premium</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
