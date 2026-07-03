'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, LogOut, Target, Baby, Star, MapPin, Settings } from 'lucide-react';
import Link from 'next/link';
import {
  PARENTING_GOAL_CATEGORIES,
  CURRENT_CHALLENGES,
  MAX_PARENTING_GOALS,
  MAX_CURRENT_CHALLENGES,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

interface Profile {
  name: string;
  childNickname?: string | null;
  childAge?: string | null;
  childInterests?: string[];
  foodPreferences?: string[];
  routineNotes?: string | null;
  developmentNotes?: string | null;
  parentingGoals?: string[];
  priorityGoal?: string | null;
  parentingGoal?: string | null;
  currentChallenges?: string[];
  location?: string | null;
  broadArea?: string | null;
  bio?: string | null;
  interests?: string[];
}

interface ReflectionContent {
  parentingWins?: string;
  developmentProgress?: string;
  eating?: string;
  sleep?: string;
  emotionalGrowth?: string;
  favouriteActivities?: string;
  happyMoments?: string;
  nextWeekFocus?: string;
  encouragement?: string;
}

const REFLECTION_SECTIONS = [
  { key: 'parentingWins', label: '⭐ Parenting Wins' },
  { key: 'developmentProgress', label: '🧠 Development Progress' },
  { key: 'eating', label: '🍎 Eating' },
  { key: 'sleep', label: '😴 Sleep' },
  { key: 'emotionalGrowth', label: '😊 Emotional Growth' },
  { key: 'favouriteActivities', label: '🎮 Favourite Activities' },
  { key: 'happyMoments', label: '❤️ Happy Family Moments' },
  { key: 'nextWeekFocus', label: '🎯 Focus Next Week' },
  { key: 'encouragement', label: '💛 Encouragement for Parents' },
] as const;

function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reflection, setReflection] = useState<ReflectionContent | null>(null);
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [editing, setEditing] = useState(searchParams.get('edit') === 'child' || searchParams.get('settings') === '1');
  const [saving, setSaving] = useState(false);

  const [childNickname, setChildNickname] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childInterests, setChildInterests] = useState('');
  const [foodPreferences, setFoodPreferences] = useState('');
  const [routineNotes, setRoutineNotes] = useState('');
  const [developmentNotes, setDevelopmentNotes] = useState('');
  const [parentingGoals, setParentingGoals] = useState<string[]>([]);
  const [priorityGoal, setPriorityGoal] = useState<string | null>(null);
  const [currentChallenges, setCurrentChallenges] = useState<string[]>([]);
  const [broadArea, setBroadArea] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/onboarding')
        .then((r) => r.json())
        .then((data) => {
          const p = data.profile;
          setProfile(p);
          if (p) {
            setChildNickname(p.childNickname || '');
            setChildAge(p.childAge || '');
            setChildInterests((p.childInterests || []).join(', '));
            setFoodPreferences((p.foodPreferences || []).join(', '));
            setRoutineNotes(p.routineNotes || '');
            setDevelopmentNotes(p.developmentNotes || '');
            setParentingGoals(p.parentingGoals || []);
            setPriorityGoal(p.priorityGoal || null);
            setCurrentChallenges(p.currentChallenges || []);
            setBroadArea(p.broadArea || '');
            setBio(p.bio || '');
          }
        });
    }
  }, [status, router]);

  useEffect(() => {
    if (searchParams.get('checkin') === '1') {
      loadReflection();
    }
  }, [searchParams]);

  const loadReflection = () => {
    setLoadingReflection(true);
    fetch('/api/reflections')
      .then((r) => r.json())
      .then((data) => setReflection(data.reflection?.content as ReflectionContent))
      .finally(() => setLoadingReflection(false));
  };

  const toggleGoal = (goal: string) => {
    setParentingGoals((prev) => {
      if (prev.includes(goal)) {
        if (priorityGoal === goal) setPriorityGoal(null);
        return prev.filter((g) => g !== goal);
      }
      if (prev.length >= MAX_PARENTING_GOALS) return prev;
      return [...prev, goal];
    });
  };

  const setAsPriority = (goal: string) => {
    if (!parentingGoals.includes(goal)) return;
    setPriorityGoal((p) => (p === goal ? null : goal));
  };

  const toggleChallenge = (challenge: string) => {
    setCurrentChallenges((prev) => {
      if (prev.includes(challenge)) return prev.filter((c) => c !== challenge);
      if (prev.length >= MAX_CURRENT_CHALLENGES) return prev;
      return [...prev, challenge];
    });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childNickname,
          childAge,
          childInterests: childInterests.split(',').map((s) => s.trim()).filter(Boolean),
          foodPreferences: foodPreferences.split(',').map((s) => s.trim()).filter(Boolean),
          routineNotes,
          developmentNotes,
          parentingGoals,
          priorityGoal,
          currentChallenges,
          broadArea,
          bio,
          onboardingComplete: true,
        }),
      });
      const data = await res.json();
      setProfile(data.profile);
      setEditing(false);
    } finally {
      setSaving(false);
    }
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

        {editing ? (
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" /> Edit Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs font-medium flex items-center gap-1"><Baby className="h-3 w-3" /> Child Profile</Label>
                <div className="space-y-2 mt-2">
                  <Input value={childNickname} onChange={(e) => setChildNickname(e.target.value)} placeholder="Nickname" />
                  <Input value={childAge} onChange={(e) => setChildAge(e.target.value)} placeholder="Age" />
                  <Input value={childInterests} onChange={(e) => setChildInterests(e.target.value)} placeholder="Interests (comma-separated)" />
                  <Input value={foodPreferences} onChange={(e) => setFoodPreferences(e.target.value)} placeholder="Food preferences" />
                  <Textarea value={routineNotes} onChange={(e) => setRoutineNotes(e.target.value)} placeholder="Routine notes" rows={2} />
                  <Textarea value={developmentNotes} onChange={(e) => setDevelopmentNotes(e.target.value)} placeholder="Development notes" rows={2} />
                </div>
              </div>

              <div>
                <Label className="text-xs">Parenting goals (up to {MAX_PARENTING_GOALS})</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5 mb-2">Tap ⭐ on a selected goal to set current priority.</p>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {PARENTING_GOAL_CATEGORIES.map((cat) => (
                    <div key={cat.title} className="flex flex-wrap gap-1">
                      {cat.goals.map((goal) => {
                        const selected = parentingGoals.includes(goal);
                        const isPriority = priorityGoal === goal;
                        return (
                          <div key={goal} className="inline-flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => toggleGoal(goal)}
                              className={cn(
                                'text-[10px] px-2 py-1 rounded-full border',
                                selected ? 'bg-primary text-primary-foreground' : 'bg-background',
                                isPriority && 'ring-2 ring-primary ring-offset-1'
                              )}
                            >
                              {goal}
                            </button>
                            {selected && (
                              <button
                                type="button"
                                aria-label={`Set ${goal} as priority`}
                                onClick={() => setAsPriority(goal)}
                                className={cn('text-xs px-1', isPriority ? 'opacity-100' : 'opacity-40')}
                              >
                                ⭐
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs">Current challenges (1–2)</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {CURRENT_CHALLENGES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleChallenge(c)}
                      className={cn(
                        'text-[10px] px-2 py-1 rounded-full border',
                        currentChallenges.includes(c) ? 'bg-primary text-primary-foreground' : 'bg-background'
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs">Parent Profile</Label>
                <div className="space-y-2 mt-2">
                  <Input value={broadArea} onChange={(e) => setBroadArea(e.target.value)} placeholder="Broad area for Connect" />
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="About you (optional)" rows={2} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl flex-1" onClick={() => setEditing(false)}>Cancel</Button>
                <Button className="rounded-xl flex-1" onClick={saveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Baby className="h-4 w-4" /> Child Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {profile?.childNickname ? (
                  <>
                    <p><span className="text-muted-foreground">Nickname:</span> {profile.childNickname}</p>
                    {profile.childAge && <p><span className="text-muted-foreground">Age:</span> {profile.childAge}</p>}
                    {profile.childInterests?.length ? (
                      <p><span className="text-muted-foreground">Interests:</span> {profile.childInterests.join(', ')}</p>
                    ) : null}
                    {profile.foodPreferences?.length ? (
                      <p><span className="text-muted-foreground">Food:</span> {profile.foodPreferences.join(', ')}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-muted-foreground">No child profile yet.</p>
                )}
                <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setEditing(true)}>
                  {profile?.childNickname ? 'Edit profile' : 'Create profile'}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" /> Parenting Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile?.parentingGoals?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {profile.parentingGoals.map((g) => (
                      <Badge key={g} variant={profile.priorityGoal === g ? 'default' : 'secondary'} className="rounded-full text-xs">
                        {profile.priorityGoal === g ? '⭐ ' : ''}{g}
                      </Badge>
                    ))}
                  </div>
                ) : profile?.parentingGoal ? (
                  <Badge variant="secondary" className="rounded-full">{profile.parentingGoal}</Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">No goals selected yet.</p>
                )}
                {profile?.currentChallenges?.length ? (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Current challenges:</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.currentChallenges.map((c) => (
                        <Badge key={c} variant="outline" className="rounded-full text-xs">{c}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                <Button variant="link" className="p-0 h-auto text-primary mt-2" onClick={() => setEditing(true)}>
                  Edit goals
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Parent Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {profile?.broadArea && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.broadArea}</span>
                  </div>
                )}
                {profile?.bio && <p className="text-muted-foreground">{profile.bio}</p>}
                {!profile?.broadArea && !profile?.bio && (
                  <p className="text-muted-foreground">Add your broad area for Connect.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4" /> Parent Check-in
              </CardTitle>
              {!reflection && (
                <Button size="sm" variant="outline" onClick={loadReflection} disabled={loadingReflection}>
                  {loadingReflection ? 'Generating...' : 'Start check-in'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {reflection ? (
              <div className="space-y-4">
                {REFLECTION_SECTIONS.map(({ key, label }) => {
                  const text = reflection[key];
                  return text ? (
                    <div key={key}>
                      <p className="text-sm font-medium mb-1">{label}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your supportive weekly check-in from MumBot — celebrating wins and looking ahead.
              </p>
            )}
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full rounded-xl" onClick={() => signOut({ callbackUrl: '/' })}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
    </AppShell>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground">Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
