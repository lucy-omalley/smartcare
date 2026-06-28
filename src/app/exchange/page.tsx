'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Gift, Plus, MapPin, Mail } from 'lucide-react';
import { EXCHANGE_CATEGORIES } from '@/lib/constants';
import { EmptyState } from '@/components/visual/empty-state';

interface Listing {
  id: string;
  category: keyof typeof EXCHANGE_CATEGORIES;
  title: string;
  description: string;
  condition: string;
  location: string;
  user: { name: string; email: string };
}

export default function ExchangePage() {
  const { status } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('TOYS');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');

  const loadListings = () =>
    fetch('/api/exchange').then((r) => r.json()).then((d) => setListings(d.listings || []));

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') loadListings();
  }, [status, router]);

  const handleCreate = async () => {
    if (!title.trim() || !condition.trim() || !location.trim()) return;
    await fetch('/api/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, title, description, condition, location }),
    });
    setTitle('');
    setDescription('');
    setCondition('');
    setLocation('');
    setShowForm(false);
    loadListings();
  };

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Toy & Book Exchange</h1>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" />
            List Item
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Neighbourhood sharing only. Arrange collection privately — no payments or delivery.
        </p>

        {showForm && (
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EXCHANGE_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Item title" />
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
              <Input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Condition (e.g. Good, Like new)" />
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Approximate location" />
              <Button onClick={handleCreate} className="w-full rounded-xl">List Item</Button>
            </CardContent>
          </Card>
        )}

        {listings.length === 0 ? (
          <EmptyState
            emoji="♻️"
            title="No toy exchanges yet?"
            description="Be the first parent in your neighbourhood to share books, toys, or baby gear."
            gradientKey="default"
            actionLabel="List an item"
            onAction={() => setShowForm(true)}
          />
        ) : (
          listings.map((listing) => (
            <Card key={listing.id} className="rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs rounded-full">
                    {EXCHANGE_CATEGORIES[listing.category]}
                  </Badge>
                  <Badge variant="outline" className="text-xs rounded-full">{listing.condition}</Badge>
                </div>
                <h3 className="font-medium text-sm mb-1">{listing.title}</h3>
                {listing.description && (
                  <p className="text-sm text-muted-foreground mb-2">{listing.description}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <MapPin className="h-3 w-3" />
                  {listing.location}
                </div>
                <a href={`mailto:${listing.user.email}?subject=SmartCare Exchange: ${listing.title}`}>
                  <Button size="sm" variant="outline" className="rounded-xl">
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    Message owner
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}
