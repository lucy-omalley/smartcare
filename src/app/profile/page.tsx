'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Target, Baby, Star } from 'lucide-react';
import Link from 'next/link';

interface Profile {
  name: string;
  childNickname?: string | null;
  childAge?: string | null;
  parentingGoal?: string | null;
}

interface ReflectionContent {
  parentingWins?: string;
  learningProgress?: string;
  happyMoments?: string;
  emotionalDevelopment?: string;
  nextWeekFocus?: string;
  encouragement?: string;
}

const REFLECTION_SECTIONS = [
  { key: 'parentingWins', label: '⭐ Parenting Wins' },
  { key: 'learningProgress', label: '🧠 Learning Progress' },
  { key: 'happyMoments', label: '😊 Happy Moments' },
  { key: 'emotionalDevelopment', label: '❤️ Emotional Development' },
  { key: 'nextWeekFocus', label: '🎯 Next Week Focus' },
  { key: 'encouragement', label: '💛 Encouragement for Parents' },
] as const;

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reflection, setReflection] = useState<ReflectionContent | null>(null);
  const [loadingReflection, setLoadingReflection] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/onboarding')
        .then((r) => r.json())
        .then((data) => setProfile(data.profile));
    }
  }, [status, router]);

  const loadReflection = () => {
    setLoadingReflection(true);
    fetch('/api/reflections')
      .then((r) => r.json())
      .then((data) => setReflection(data.reflection?.content as ReflectionContent))
      .finally(() => setLoadingReflection(false));
  };

  if (status === 'loading') {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-6 text-center text-muted-foreground">Loading...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center gap-3 pt-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile?.name || session?.user?.name}</h1>
            <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
          </div>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Baby className="h-4 w-4" />
              Family
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {profile?.childNickname && (
              <p><span className="text-muted-foreground">Child:</span> {profile.childNickname}</p>
            )}
            {profile?.childAge && (
              <p><span className="text-muted-foreground">Age:</span> {profile.childAge}</p>
            )}
            {profile?.parentingGoal && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="rounded-full">{profile.parentingGoal}</Badge>
              </div>
            )}
            <Link href="/onboarding">
              <Button variant="link" className="p-0 h-auto text-primary">Update profile</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4" />
                Weekly Reflection
              </CardTitle>
              {!reflection && (
                <Button size="sm" variant="outline" onClick={loadReflection} disabled={loadingReflection}>
                  {loadingReflection ? 'Generating...' : 'Generate'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {reflection ? (
              <div className="space-y-4">
                {REFLECTION_SECTIONS.map(({ key, label }) =>
                  reflection[key] ? (
                    <div key={key}>
                      <p className="text-sm font-medium mb-1">{label}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{reflection[key]}</p>
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your supportive weekly letter from MumBot — celebrating wins and looking ahead.
              </p>
            )}
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full rounded-xl"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </AppShell>
  );
}
