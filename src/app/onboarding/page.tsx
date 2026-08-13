'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bot, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  PARENTING_GOAL_CATEGORIES,
  CURRENT_CHALLENGES,
  MAX_PARENTING_GOALS,
  MAX_CURRENT_CHALLENGES,
} from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { ChildBirthdayPicker } from '@/components/profile/child-birthday-picker';
import { markTodayPlanStale } from '@/lib/today-plan-stale';

const STEPS = ['welcome', 'child', 'goals', 'challenges', 'area', 'ready'] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(session?.user?.name || '');
  const [childNickname, setChildNickname] = useState('');
  const [childBirthday, setChildBirthday] = useState<string | null>(null);
  const [childInterests, setChildInterests] = useState('');
  const [favouriteAnimal, setFavouriteAnimal] = useState('');
  const [favouriteVehicle, setFavouriteVehicle] = useState('');
  const [favouriteCharacter, setFavouriteCharacter] = useState('');
  const [storyLearningTheme, setStoryLearningTheme] = useState('');
  const [foodPreferences, setFoodPreferences] = useState('');
  const [routineNotes, setRoutineNotes] = useState('');
  const [parentingGoals, setParentingGoals] = useState<string[]>([]);
  const [currentChallenges, setCurrentChallenges] = useState<string[]>([]);
  const [broadArea, setBroadArea] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && !localStorage.getItem('parenfy_onboarding_start')) {
      localStorage.setItem('parenfy_onboarding_start', String(Date.now()));
      trackEvent('onboarding_started');
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/onboarding')
        .then((r) => r.json())
        .then(({ profile }) => {
          if (!profile) return;
          if (profile.name) setName(profile.name);
          if (profile.childNickname) setChildNickname(profile.childNickname);
          if (profile.childBirthday) setChildBirthday(profile.childBirthday);
          if (profile.childInterests?.length) setChildInterests(profile.childInterests.join(', '));
          if (profile.foodPreferences?.length) setFoodPreferences(profile.foodPreferences.join(', '));
          if (profile.routineNotes) setRoutineNotes(profile.routineNotes);
          if (profile.parentingGoals?.length) setParentingGoals(profile.parentingGoals);
          if (profile.currentChallenges?.length) setCurrentChallenges(profile.currentChallenges);
          if (profile.broadArea) setBroadArea(profile.broadArea);
          if (profile.location) setLocation(profile.location);
        });
    }
  }, [status]);

  const toggleGoal = (goal: string) => {
    setParentingGoals((prev) => {
      if (prev.includes(goal)) return prev.filter((g) => g !== goal);
      if (prev.length >= MAX_PARENTING_GOALS) return prev;
      return [...prev, goal];
    });
  };

  const toggleChallenge = (challenge: string) => {
    setCurrentChallenges((prev) => {
      if (prev.includes(challenge)) return prev.filter((c) => c !== challenge);
      if (prev.length >= MAX_CURRENT_CHALLENGES) return prev;
      return [...prev, challenge];
    });
  };

  const saveProgress = async (complete = false) => {
    setLoading(true);
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          childNickname,
          childBirthday,
          childInterests: childInterests.split(',').map((s) => s.trim()).filter(Boolean),
          favouriteAnimal: favouriteAnimal.trim() || undefined,
          favouriteVehicle: favouriteVehicle.trim() || undefined,
          favouriteCharacter: favouriteCharacter.trim() || undefined,
          storyLearningTheme: storyLearningTheme.trim() || undefined,
          foodPreferences: foodPreferences.split(',').map((s) => s.trim()).filter(Boolean),
          routineNotes,
          parentingGoals,
          currentChallenges,
          broadArea,
          location,
          onboardingComplete: complete,
        }),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    await saveProgress(true);
    markTodayPlanStale();
    const startRaw = localStorage.getItem("parenfy_onboarding_start");
    const durationSeconds = startRaw
      ? Math.round((Date.now() - parseInt(startRaw, 10)) / 1000)
      : undefined;
    trackEvent("onboarding_completed", durationSeconds ? { duration_seconds: durationSeconds } : undefined);
    if (childBirthday) trackEvent('child_profile_created');
    if (parentingGoals.length) trackEvent('parenting_goals_selected', { count: parentingGoals.length });
    if (currentChallenges.length) trackEvent('current_challenges_selected', { count: currentChallenges.length });
    if (broadArea || location) trackEvent('connect_area_selected');
    router.push('/today?welcome=1');
  };

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-primary/5 to-background">
      <div className="w-full max-w-md mx-auto mb-4">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Card className="w-full max-w-md mx-auto rounded-2xl shadow-lg flex-1">
        {step === 'welcome' && (
          <>
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to Parenfy</CardTitle>
              <CardDescription>
                Your AI parenting companion. Know what to do next each day, and connect with other parents when you want support.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Your first name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Lucy" required className="mt-1" />
              </div>
              <Button className="w-full rounded-xl" size="lg" onClick={() => setStep('child')} disabled={!name.trim()}>
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </>
        )}

        {step === 'child' && (
          <>
            <CardHeader>
              <CardTitle className="text-xl">Child profile</CardTitle>
              <CardDescription>Just the basics — MumBot can learn more over time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nickname">Child&apos;s nickname</Label>
                <Input id="nickname" value={childNickname} onChange={(e) => setChildNickname(e.target.value)} placeholder="Emma" className="mt-1" />
              </div>
              <div>
                <ChildBirthdayPicker
                  value={childBirthday}
                  onChange={setChildBirthday}
                  idPrefix="onboarding-child-dob"
                />
              </div>
              <div>
                <Label htmlFor="interests">Interests (comma-separated)</Label>
                <Input id="interests" value={childInterests} onChange={(e) => setChildInterests(e.target.value)} placeholder="dinosaurs, puzzles, music" className="mt-1" />
              </div>
              <p className="text-xs text-muted-foreground">Story personalization (optional)</p>
              <div className="grid grid-cols-2 gap-2">
                <Input value={favouriteAnimal} onChange={(e) => setFavouriteAnimal(e.target.value)} placeholder="Favourite animal" />
                <Input value={favouriteVehicle} onChange={(e) => setFavouriteVehicle(e.target.value)} placeholder="Favourite vehicle" />
                <Input value={favouriteCharacter} onChange={(e) => setFavouriteCharacter(e.target.value)} placeholder="Favourite character" className="col-span-2" />
                <Input value={storyLearningTheme} onChange={(e) => setStoryLearningTheme(e.target.value)} placeholder="Learning theme (e.g. sharing)" className="col-span-2" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setStep('welcome')}><ArrowLeft className="h-4 w-4" /></Button>
                <Button
                  className="flex-1 rounded-xl"
                  onClick={() => setStep('goals')}
                  disabled={!childBirthday}
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'goals' && (
          <>
            <CardHeader>
              <CardTitle className="text-xl">What would you like Parenfy to help you with?</CardTitle>
              <CardDescription>Choose up to {MAX_PARENTING_GOALS} goals. You can change these anytime.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[50vh] overflow-y-auto">
              {PARENTING_GOAL_CATEGORIES.map((cat) => (
                <div key={cat.title}>
                  <p className="text-sm font-medium mb-2">{cat.emoji} {cat.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.goals.map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleGoal(goal)}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-full border transition-colors',
                          parentingGoals.includes(goal)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted'
                        )}
                      >
                        {parentingGoals.includes(goal) && <Check className="inline h-3 w-3 mr-1" />}
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setStep('child')}><ArrowLeft className="h-4 w-4" /></Button>
                <Button className="flex-1 rounded-xl" onClick={() => setStep('challenges')} disabled={parentingGoals.length === 0}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'challenges' && (
          <>
            <CardHeader>
              <CardTitle className="text-xl">What is your biggest parenting challenge right now?</CardTitle>
              <CardDescription>Choose 1–2 that feel most relevant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {CURRENT_CHALLENGES.map((challenge) => (
                <label key={challenge} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-muted/50">
                  <Checkbox
                    checked={currentChallenges.includes(challenge)}
                    onCheckedChange={() => toggleChallenge(challenge)}
                  />
                  <span className="text-sm">{challenge}</span>
                </label>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setStep('goals')}><ArrowLeft className="h-4 w-4" /></Button>
                <Button className="flex-1 rounded-xl" onClick={() => setStep('area')}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'area' && (
          <>
            <CardHeader>
              <CardTitle className="text-xl">Broad area for Connect</CardTitle>
              <CardDescription>Optional — only broad areas are shown publicly. Skip if you prefer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="broadArea">Your broad area</Label>
                <Input id="broadArea" value={broadArea} onChange={(e) => setBroadArea(e.target.value)} placeholder="Clontarf, Dublin" className="mt-1" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setStep('challenges')}><ArrowLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" className="rounded-xl" onClick={() => { trackEvent('onboarding_skipped', { step: 'area' }); setStep('ready'); }}>Skip</Button>
                <Button className="flex-1 rounded-xl" onClick={() => setStep('ready')} disabled={!broadArea.trim()}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'ready' && (
          <>
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-3xl">🌞</span>
              </div>
              <CardTitle className="text-xl">You&apos;re all set!</CardTitle>
              <CardDescription>
                Your 30-day Premium beta trial starts now. Your personalised Today dashboard is ready.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full rounded-xl" size="lg" onClick={handleFinish} disabled={loading}>
                {loading ? 'Opening...' : 'Open Today Dashboard'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
