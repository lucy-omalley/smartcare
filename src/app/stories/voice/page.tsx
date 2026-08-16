'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mic, Plus, Trash2, Sparkles } from 'lucide-react';
import { RELATIONSHIP_OPTIONS } from '@/lib/voice/recording-script';
import { VoiceUsageSummary } from '@/components/storytime/voice-usage-summary';
import type { VoiceUsageSnapshot } from '@/types/voice-usage';
import { toast } from 'sonner';

interface VoiceProfile {
  id: string;
  name: string;
  relationship: string;
  avatarEmoji: string;
  status: string;
  recordingCount: number;
  createdAt: string;
}

export default function VoiceLibraryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [voiceUsage, setVoiceUsage] = useState<VoiceUsageSnapshot | null>(null);

  const load = () => {
    Promise.all([
      fetch('/api/voice/profiles').then((r) => r.json()),
      fetch('/api/storytime/features').then((r) => r.json()),
    ])
      .then(([voiceData, featData]) => {
        setProfiles(voiceData.profiles ?? []);
        setIsPremium(featData.features?.familyVoiceEnabled ?? false);
        setVoiceUsage(featData.features?.voiceUsage ?? null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    if (status === 'authenticated') load();
  }, [status, router]);

  const deleteProfile = async (id: string) => {
    if (!confirm('Permanently delete this voice? Recordings cannot be recovered.')) return;
    const res = await fetch(`/api/voice/profiles/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Could not delete voice');
      return;
    }
    toast.success('Voice deleted');
    load();
  };

  const relLabel = (r: string) => RELATIONSHIP_OPTIONS.find((o) => o.value === r)?.label ?? r;

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4 pb-24">
        <div className="flex items-center gap-2 pt-2">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/stories"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Mic className="h-5 w-5" /> Voice library</h1>
            <p className="text-xs text-muted-foreground">Family voices for bedtime stories</p>
          </div>
        </div>

        <Button asChild className="w-full rounded-xl" disabled={!isPremium}>
          <Link href={isPremium ? '/stories/voice/record' : '/billing'}>
            <Plus className="h-4 w-4 mr-2" />
            {isPremium ? 'Record a new voice' : 'Upgrade to record your voice'}
          </Link>
        </Button>

        {isPremium && <VoiceUsageSummary usage={voiceUsage} />}

        {!isPremium && (
          <Card className="rounded-2xl border-primary/20 bg-primary/5">
            <CardContent className="p-4 text-sm text-muted-foreground">
              Family voice narration is included with Premium. You can still create AI bedtime stories on the free plan.
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading voices…</p>
        ) : profiles.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No voices yet. Record Mum, Dad, or a grandparent so stories feel like home.
            </CardContent>
          </Card>
        ) : (
          profiles.map((p) => (
            <Card key={p.id} className="rounded-2xl">
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-3xl">{p.avatarEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{relLabel(p.relationship)}</p>
                  <Badge variant={p.status === 'READY' ? 'default' : 'secondary'} className="mt-1 text-[10px] rounded-full">
                    {p.status === 'READY' ? 'Ready' : p.status.toLowerCase()}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  {p.status === 'READY' && (
                    <Button size="sm" className="rounded-full text-xs" asChild>
                      <Link href="/stories/create">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Create story
                      </Link>
                    </Button>
                  )}
                  {p.status !== 'READY' && (
                    <Button size="sm" variant="outline" className="rounded-full text-xs" asChild>
                      <Link href={`/stories/voice/record?profileId=${p.id}`}>Continue</Link>
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteProfile(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}
