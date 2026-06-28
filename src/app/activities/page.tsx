'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, MapPin } from 'lucide-react';
import { ACTIVITY_CATEGORIES } from '@/lib/constants';
import { EmptyState } from '@/components/visual/empty-state';
import { format } from 'date-fns';

interface Activity {
  id: string;
  title: string;
  description: string;
  category: keyof typeof ACTIVITY_CATEGORIES;
  date: string;
  location: string;
}

export default function ActivitiesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');

  const loadActivities = () =>
    fetch('/api/activities').then((r) => r.json()).then((d) => setActivities(d.activities || []));

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') loadActivities();
  }, [status, router]);

  const handleCreate = async () => {
    if (!title.trim() || !date || !location.trim()) return;
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category, date, location }),
    });
    setTitle('');
    setDescription('');
    setDate('');
    setLocation('');
    setShowForm(false);
    loadActivities();
  };

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Local Activities</h1>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Event
          </Button>
        </div>

        {showForm && (
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIVITY_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
              <Button onClick={handleCreate} className="w-full rounded-xl">Create Event</Button>
            </CardContent>
          </Card>
        )}

        {activities.length === 0 ? (
          <EmptyState
            emoji="🎉"
            title="No activities nearby?"
            description="We'll recommend some soon. Be the first to add a local family event!"
            gradientKey="activity"
            actionLabel="Add an event"
            onAction={() => setShowForm(true)}
          />
        ) : (
          activities.map((activity) => (
            <Card key={activity.id} className="rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs rounded-full">
                    {ACTIVITY_CATEGORIES[activity.category]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(activity.date), 'EEE, MMM d')}
                  </span>
                </div>
                <h3 className="font-medium text-sm mb-1">{activity.title}</h3>
                {activity.description && (
                  <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {activity.location}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}
