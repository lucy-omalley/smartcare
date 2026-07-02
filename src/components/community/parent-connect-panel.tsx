'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Baby, Target, Loader2, UserPlus, Clock, MessageCircle } from 'lucide-react';
import { CHILD_AGE_BANDS, PARENT_INTERESTS } from '@/lib/constants';
import { toast } from 'sonner';
import type { MatchResult } from '@/lib/services/parent-matching';

interface ConnectProfile {
  bio?: string | null;
  interests: string[];
  openToConnect: boolean;
  location?: string | null;
  childAge?: string | null;
}

interface ParentConnectPanelProps {
  onOpenChat: (threadId: string) => void;
  onRequestsChange?: () => void;
}

export function ParentConnectPanel({ onOpenChat, onRequestsChange }: ParentConnectPanelProps) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [profile, setProfile] = useState<ConnectProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [openToConnect, setOpenToConnect] = useState(true);
  const [filterLocation, setFilterLocation] = useState('');
  const [filterInterest, setFilterInterest] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [introByUser, setIntroByUser] = useState<Record<string, string>>({});

  const loadDiscover = useCallback(() => {
    const params = new URLSearchParams();
    if (filterLocation) params.set('location', filterLocation);
    if (filterInterest) params.set('interest', filterInterest);
    if (filterAge) params.set('childAge', filterAge);
    setLoading(true);
    fetch(`/api/parents/discover?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setMatches(d.matches || []);
        if (d.viewer) {
          setProfile(d.viewer);
          setBio(d.viewer.bio || '');
          setInterests(d.viewer.interests || []);
          setOpenToConnect(d.viewer.openToConnect ?? true);
          if (!filterLocation && d.viewer.location) {
            setFilterLocation(d.viewer.location.split(',')[0].trim());
          }
        }
      })
      .finally(() => setLoading(false));
  }, [filterLocation, filterInterest, filterAge]);

  useEffect(() => {
    loadDiscover();
  }, [loadDiscover]);

  const saveProfile = async () => {
    const res = await fetch('/api/parents/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio, interests, openToConnect }),
    });
    if (res.ok) {
      toast.success('Connect profile updated');
      setShowProfile(false);
      loadDiscover();
    }
  };

  const sendConnect = async (recipientId: string) => {
    setConnectingId(recipientId);
    try {
      const res = await fetch('/api/parents/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, introMessage: introByUser[recipientId] || '' }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Could not send request');
        return;
      }
      toast.success('Connection request sent!');
      onRequestsChange?.();
      loadDiscover();
    } finally {
      setConnectingId(null);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl bg-gradient-to-br from-violet-50 to-sky-50 border-violet-100">
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-medium">Find parents near you</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Match by location, child age, parenting goals &amp; interests. Send a request, then chat once they accept.
          </p>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setShowProfile(!showProfile)}>
            {showProfile ? 'Hide profile' : 'My connect profile'}
          </Button>
        </CardContent>
      </Card>

      {showProfile && (
        <Card className="rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <div>
              <Label className="text-xs">Short bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Mum of 2 in Dublin, love park walks and gentle parenting..."
                className="mt-1 min-h-[72px]"
              />
            </div>
            <div>
              <Label className="text-xs mb-2 block">Interests</Label>
              <div className="flex flex-wrap gap-2">
                {PARENT_INTERESTS.map((interest) => (
                  <Badge
                    key={interest}
                    variant={interests.includes(interest) ? 'default' : 'outline'}
                    className="cursor-pointer rounded-full"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="openConnect" checked={openToConnect} onCheckedChange={(c) => setOpenToConnect(!!c)} />
              <Label htmlFor="openConnect" className="text-sm">Visible to other parents</Label>
            </div>
            <Button onClick={saveProfile} className="w-full rounded-xl">Save profile</Button>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Filter matches</p>
          <Input value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} placeholder="City or area" />
          <Input value={filterInterest} onChange={(e) => setFilterInterest(e.target.value)} placeholder="Interest or goal" />
          <select
            value={filterAge}
            onChange={(e) => setFilterAge(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Any child age</option>
            {CHILD_AGE_BANDS.map((band) => (
              <option key={band} value={band}>{band}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" className="w-full rounded-xl" onClick={loadDiscover}>
            Search parents
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            No parents found yet. Update your profile and check back — more families join every day.
          </CardContent>
        </Card>
      ) : (
        matches.map((match) => (
          <Card key={match.profile.id} className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{match.profile.name}</h3>
                  {match.profile.childNickname && (
                    <p className="text-xs text-muted-foreground">Parent of {match.profile.childNickname}</p>
                  )}
                </div>
                {match.score > 0 && (
                  <Badge className="rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 shrink-0">
                    {match.score}% match
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {match.profile.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{match.profile.location}</span>
                )}
                {match.profile.childAge && (
                  <span className="flex items-center gap-1"><Baby className="h-3 w-3" />{match.profile.childAge}</span>
                )}
                {match.profile.parentingGoal && (
                  <span className="flex items-center gap-1"><Target className="h-3 w-3" />{match.profile.parentingGoal}</span>
                )}
              </div>

              {match.profile.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed">{match.profile.bio}</p>
              )}

              {match.profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {match.profile.interests.map((i) => (
                    <Badge key={i} variant="secondary" className="rounded-full text-xs">{i}</Badge>
                  ))}
                </div>
              )}

              {match.reasons.length > 0 && (
                <p className="text-xs text-primary/80">{match.reasons.join(' · ')}</p>
              )}

              {match.connectionStatus === 'none' && (
                <div className="space-y-2">
                  <Input
                    value={introByUser[match.profile.id] || ''}
                    onChange={(e) => setIntroByUser((p) => ({ ...p, [match.profile.id]: e.target.value }))}
                    placeholder="Say hi — optional intro message"
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    className="w-full rounded-xl"
                    disabled={connectingId === match.profile.id}
                    onClick={() => sendConnect(match.profile.id)}
                  >
                    {connectingId === match.profile.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-1" />
                    )}
                    Connect
                  </Button>
                </div>
              )}
              {match.connectionStatus === 'pending_sent' && (
                <Badge variant="outline" className="rounded-full"><Clock className="h-3 w-3 mr-1" />Request sent</Badge>
              )}
              {match.connectionStatus === 'pending_received' && (
                <Badge variant="secondary" className="rounded-full">Wants to connect — check Requests</Badge>
              )}
              {match.connectionStatus === 'connected' && match.threadId && (
                <Button size="sm" className="w-full rounded-xl" onClick={() => onOpenChat(match.threadId!)}>
                  <MessageCircle className="h-4 w-4 mr-1" /> Open chat
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
