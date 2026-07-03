'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Calendar, Inbox, UserCircle, Shield, Heart } from 'lucide-react';
import { format } from 'date-fns';
import {
  PRIVACY_COPY,
  TIME_WINDOWS,
  CONNECT_INTERESTS,
  CONNECT_AGE_RANGES,
  EVENT_ACTIVITY_TYPES,
} from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';
import { toast } from 'sonner';

type ConnectTab = 'available' | 'events' | 'requests' | 'my';

interface ParentStatus {
  id: string;
  parentFirstName: string;
  broadArea: string;
  timeWindow: string;
  interest: string;
  childAgeRange: string;
  note?: string | null;
  userId: string;
}

interface ConnectEvent {
  id: string;
  title: string;
  broadArea: string;
  date: string;
  timeWindow: string;
  activityType: string;
  childAgeRange: string;
  maxParticipants?: number | null;
  description?: string | null;
  joinApprovalType: string;
  participantCount: number;
  organiserFirstName: string;
}

interface ConnectRequest {
  id: string;
  requestType: string;
  status: string;
  isIncoming: boolean;
  otherParentName: string;
  event?: { title: string } | null;
  createdAt: string;
}

function tabFromParams(tab: string | null): ConnectTab {
  if (tab === 'events') return 'events';
  if (tab === 'requests') return 'requests';
  if (tab === 'my') return 'my';
  return 'available';
}

function ConnectContent() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<ConnectTab>(tabFromParams(searchParams.get('tab')));
  const [statuses, setStatuses] = useState<ParentStatus[]>([]);
  const [myStatus, setMyStatus] = useState<Record<string, unknown> | null>(null);
  const [events, setEvents] = useState<ConnectEvent[]>([]);
  const [requests, setRequests] = useState<ConnectRequest[]>([]);
  const [myConnect, setMyConnect] = useState<Record<string, unknown> | null>(null);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [broadArea, setBroadArea] = useState('');
  const [timeWindow, setTimeWindow] = useState('Morning');
  const [interest, setInterest] = useState('Park');
  const [childAgeRange, setChildAgeRange] = useState('Toddler');
  const [note, setNote] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const [eventTitle, setEventTitle] = useState('');
  const [eventArea, setEventArea] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('Morning');
  const [eventActivity, setEventActivity] = useState('Park walk');
  const [eventAgeRange, setEventAgeRange] = useState('Toddler');
  const [eventDescription, setEventDescription] = useState('');
  const [eventMax, setEventMax] = useState('');
  const [exactLocation, setExactLocation] = useState('');

  const loadAvailable = () =>
    fetch('/api/connect/status')
      .then((r) => r.json())
      .then((d) => {
        setStatuses(d.statuses || []);
        setMyStatus(d.myStatus || null);
        if (d.myStatus?.broadArea) setBroadArea(d.myStatus.broadArea);
      });

  const loadEvents = () =>
    fetch('/api/connect/events')
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []));

  const loadRequests = () =>
    fetch('/api/connect/requests')
      .then((r) => r.json())
      .then((d) => setRequests(d.requests || []));

  const loadMy = () =>
    fetch('/api/connect/my')
      .then((r) => r.json())
      .then((d) => setMyConnect(d));

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      Promise.all([loadAvailable(), loadEvents(), loadRequests(), loadMy()]).finally(() => setLoading(false));
    }
  }, [status, router]);

  useEffect(() => {
    setTab(tabFromParams(searchParams.get('tab')));
  }, [searchParams]);

  const switchTab = (next: ConnectTab) => {
    setTab(next);
    router.replace(`/connect?tab=${next}`, { scroll: false });
  };

  const saveStatus = async () => {
    if (!broadArea.trim()) {
      toast.error('Please enter a broad area');
      return;
    }
    await fetch('/api/connect/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ broadArea, timeWindow, interest, childAgeRange, note, isOpen }),
    });
    trackEvent('connect_status_created');
    toast.success(isOpen ? 'You\'re open to connect today!' : 'Status saved as private');
    setShowStatusForm(false);
    loadAvailable();
    loadMy();
  };

  const clearStatus = async () => {
    await fetch('/api/connect/status', { method: 'DELETE' });
    setMyStatus(null);
    loadAvailable();
    loadMy();
  };

  const sendInterest = async (statusId: string) => {
    await fetch('/api/connect/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statusId }),
    });
    toast.success('Interest sent!');
    loadRequests();
  };

  const createEvent = async () => {
    if (!eventTitle.trim() || !eventArea.trim() || !eventDate) return;
    await fetch('/api/connect/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: eventTitle,
        broadArea: eventArea,
        exactLocation: exactLocation || undefined,
        date: eventDate,
        timeWindow: eventTime,
        activityType: eventActivity,
        childAgeRange: eventAgeRange,
        maxParticipants: eventMax || undefined,
        description: eventDescription,
        joinApprovalType: 'auto',
      }),
    });
    trackEvent('event_created');
    toast.success('Event published!');
    setShowEventForm(false);
    loadEvents();
    loadMy();
  };

  const joinEvent = async (eventId: string) => {
    const res = await fetch(`/api/connect/events/${eventId}/join`, { method: 'POST' });
    const data = await res.json();
    if (data.pending) {
      toast.success('Join request sent');
    } else if (data.joined) {
      trackEvent('event_joined');
      toast.success('You joined the event!');
    }
    loadEvents();
    loadRequests();
  };

  const handleRequest = async (id: string, action: 'accept' | 'decline') => {
    await fetch(`/api/connect/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    loadRequests();
    loadMy();
  };

  if (loading) {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-6 text-center text-muted-foreground">Loading Connect...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4">
        <div className="pt-2 space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Connect</h1>
          </div>
          <p className="text-xs text-muted-foreground">Set broad availability or join parent-led events safely.</p>
        </div>

        <Card className="rounded-2xl bg-primary/5 border-primary/10">
          <CardContent className="p-3 space-y-1 text-xs text-muted-foreground">
            <p className="flex items-start gap-2"><Shield className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />{PRIVACY_COPY.broadAvailability}</p>
            <p>{PRIVACY_COPY.exactMeetup}</p>
            <p>{PRIVACY_COPY.noHomeAddress}</p>
          </CardContent>
        </Card>

        <div className="flex gap-2 flex-wrap">
          {([
            ['available', 'Available Today'],
            ['events', 'Upcoming Events'],
            ['requests', 'Requests'],
            ['my', 'My Connect'],
          ] as const).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={tab === key ? 'default' : 'outline'}
              className="rounded-full text-xs"
              onClick={() => switchTab(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {tab === 'available' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Parents available today</p>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setShowStatusForm(!showStatusForm)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                My Status
              </Button>
            </div>

            {showStatusForm && (
              <Card className="rounded-2xl">
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant={isOpen ? 'default' : 'outline'} className="rounded-full flex-1" onClick={() => setIsOpen(true)}>Open to connect</Button>
                    <Button size="sm" variant={!isOpen ? 'default' : 'outline'} className="rounded-full flex-1" onClick={() => setIsOpen(false)}>Private today</Button>
                  </div>
                  <div>
                    <Label className="text-xs">Broad area</Label>
                    <Input value={broadArea} onChange={(e) => setBroadArea(e.target.value)} placeholder="Clontarf" />
                  </div>
                  <div>
                    <Label className="text-xs">Time window</Label>
                    <Select value={timeWindow} onValueChange={setTimeWindow}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIME_WINDOWS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Interest</Label>
                    <Select value={interest} onValueChange={setInterest}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONNECT_INTERESTS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Child age range</Label>
                    <Select value={childAgeRange} onValueChange={setChildAgeRange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONNECT_AGE_RANGES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Optional note</Label>
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Short note..." />
                  </div>
                  <Button className="w-full rounded-xl" onClick={saveStatus}>Save status</Button>
                  {myStatus && (
                    <Button variant="ghost" className="w-full text-destructive" onClick={clearStatus}>Clear status</Button>
                  )}
                </CardContent>
              </Card>
            )}

            {statuses.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="p-8 text-center text-muted-foreground text-sm">
                  No parents available today yet. Set your status to get started!
                </CardContent>
              </Card>
            ) : (
              statuses.map((s) => (
                <Card key={s.id} className="rounded-2xl">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-1">{s.parentFirstName}</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {s.broadArea} · {s.timeWindow} · {s.interest} · {s.childAgeRange} · Open to connect
                    </p>
                    {s.note && <p className="text-xs italic mb-3">&ldquo;{s.note}&rdquo;</p>}
                    <Button size="sm" className="rounded-xl" onClick={() => sendInterest(s.id)}>
                      <Heart className="h-3.5 w-3.5 mr-1" /> I&apos;m interested
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {tab === 'events' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Upcoming events</p>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setShowEventForm(!showEventForm)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Create event
              </Button>
            </div>

            {showEventForm && (
              <Card className="rounded-2xl">
                <CardContent className="p-4 space-y-3">
                  <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Event title" />
                  <Input value={eventArea} onChange={(e) => setEventArea(e.target.value)} placeholder="Broad area" />
                  <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                  <Select value={eventTime} onValueChange={setEventTime}>
                    <SelectTrigger><SelectValue placeholder="Time window" /></SelectTrigger>
                    <SelectContent>
                      {TIME_WINDOWS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={eventActivity} onValueChange={setEventActivity}>
                    <SelectTrigger><SelectValue placeholder="Activity type" /></SelectTrigger>
                    <SelectContent>
                      {EVENT_ACTIVITY_TYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={eventAgeRange} onValueChange={setEventAgeRange}>
                    <SelectTrigger><SelectValue placeholder="Age range" /></SelectTrigger>
                    <SelectContent>
                      {CONNECT_AGE_RANGES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input value={eventMax} onChange={(e) => setEventMax(e.target.value)} placeholder="Max participants (optional)" type="number" />
                  <Textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="Description" rows={2} />
                  <Input value={exactLocation} onChange={(e) => setExactLocation(e.target.value)} placeholder="Exact location (optional)" />
                  {exactLocation && (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">
                      Only share exact location if you are comfortable. You can also share details privately after accepting join requests.
                    </p>
                  )}
                  <Button className="w-full rounded-xl" onClick={createEvent}>Publish event</Button>
                </CardContent>
              </Card>
            )}

            {events.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="p-8 text-center text-muted-foreground text-sm">
                  No upcoming events. Create a park walk or coffee morning!
                </CardContent>
              </Card>
            ) : (
              events.map((e) => (
                <Card key={e.id} className="rounded-2xl">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm mb-1">{e.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {e.broadArea} · {format(new Date(e.date), 'EEE, MMM d')} · {e.timeWindow} · {e.activityType}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {e.childAgeRange} · {e.participantCount}{e.maxParticipants ? `/${e.maxParticipants}` : ''} joined
                    </p>
                    {e.description && <p className="text-xs mb-3">{e.description}</p>}
                    {e.organiserFirstName !== session?.user?.name?.split(' ')[0] && (
                      <Button size="sm" className="rounded-xl" onClick={() => joinEvent(e.id)}>
                        {e.joinApprovalType === 'request' ? 'Request to Join' : 'Join'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {tab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="p-8 text-center text-muted-foreground text-sm">
                  <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No connection requests yet.
                </CardContent>
              </Card>
            ) : (
              requests.map((r) => (
                <Card key={r.id} className="rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs rounded-full">{r.status}</Badge>
                      <span className="text-xs text-muted-foreground">{r.requestType === 'STATUS_INTEREST' ? 'Available Today' : 'Event join'}</span>
                    </div>
                    <p className="text-sm">
                      {r.isIncoming ? `${r.otherParentName} is interested` : `You → ${r.otherParentName}`}
                      {r.event && ` · ${r.event.title}`}
                    </p>
                    {r.status === 'ACCEPTED' && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        TODO: Private messaging placeholder — share meetup details when both parents feel comfortable.
                      </p>
                    )}
                    {r.isIncoming && r.status === 'PENDING' && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="rounded-xl" onClick={() => handleRequest(r.id, 'accept')}>Accept</Button>
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleRequest(r.id, 'decline')}>Decline</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {tab === 'my' && myConnect && (
          <div className="space-y-3">
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <p className="text-sm font-medium flex items-center gap-2"><UserCircle className="h-4 w-4" /> My Available Today status</p>
                {myConnect.myStatus ? (
                  <p className="text-xs text-muted-foreground mt-2">
                    {(myConnect.myStatus as { broadArea: string }).broadArea} · Active today
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">No active status</p>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <p className="text-sm font-medium flex items-center gap-2"><Calendar className="h-4 w-4" /> My upcoming events</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {((myConnect.myEvents as unknown[]) || []).length} events organised
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground">Loading...</div>}>
      <ConnectContent />
    </Suspense>
  );
}
