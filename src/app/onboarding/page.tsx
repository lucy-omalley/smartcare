'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bot, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PARENTING_GOALS } from '@/lib/constants';

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState(session?.user?.name || '');
  const [childNickname, setChildNickname] = useState('');
  const [childAge, setChildAge] = useState('');
  const [parentingGoal, setParentingGoal] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/onboarding')
        .then((r) => r.json())
        .then(({ profile }) => {
          if (profile) {
            if (profile.name) setName(profile.name);
            if (profile.childNickname) setChildNickname(profile.childNickname);
            if (profile.childAge) setChildAge(profile.childAge);
            if (profile.parentingGoal) setParentingGoal(profile.parentingGoal);
            if (profile.location) setLocation(profile.location);
          }
        });
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !childAge.trim() || !parentingGoal) return;

    setLoading(true);
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, childNickname, childAge, parentingGoal, location }),
      });
      router.push('/home');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-background">
      <Card className="w-full max-w-md rounded-2xl shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to SmartCare</CardTitle>
          <CardDescription>
            Meet MumBot — Your AI Co-Parent. Let&apos;s get to know your family.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Lucy"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="nickname">Child&apos;s nickname <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="nickname"
                value={childNickname}
                onChange={(e) => setChildNickname(e.target.value)}
                placeholder="Emma"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="age">Child&apos;s age</Label>
              <Input
                id="age"
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                placeholder="2 years old"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Current parenting goal</Label>
              <Select value={parentingGoal} onValueChange={setParentingGoal} required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a goal" />
                </SelectTrigger>
                <SelectContent>
                  {PARENTING_GOALS.map((goal) => (
                    <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Your city <span className="text-muted-foreground">(for local weather)</span></Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Dublin, IE"
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full rounded-xl" size="lg" disabled={loading}>
              {loading ? 'Setting up...' : 'Start with MumBot'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
