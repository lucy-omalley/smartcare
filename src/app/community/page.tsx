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
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Plus, Coffee, MessageSquare, Heart, MessagesSquare } from 'lucide-react';
import { POST_TYPES } from '@/lib/constants';
import { format } from 'date-fns';
import { ParentConnectPanel } from '@/components/community/parent-connect-panel';
import { ParentChatsPanel } from '@/components/community/parent-chats-panel';
import { ParentChatRoom } from '@/components/community/parent-chat-room';

interface Post {
  id: string;
  type: keyof typeof POST_TYPES;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
}

interface Meetup {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  childAgeRange: string;
  maxAttendees: number;
  user: { name: string };
  _count: { attendees: number };
}

type CommunityTab = 'posts' | 'meetups' | 'connect' | 'chats';

function tabFromParams(tab: string | null): CommunityTab {
  if (tab === 'meetups') return 'meetups';
  if (tab === 'connect') return 'connect';
  if (tab === 'chats') return 'chats';
  return 'posts';
}

function CommunityContent() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<CommunityTab>(tabFromParams(searchParams.get('tab')));
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [chatsRefresh, setChatsRefresh] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [postType, setPostType] = useState<string>('QUESTION');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [meetupTitle, setMeetupTitle] = useState('');
  const [meetupDate, setMeetupDate] = useState('');
  const [meetupTime, setMeetupTime] = useState('');
  const [meetupLocation, setMeetupLocation] = useState('');
  const [childAgeRange, setChildAgeRange] = useState('0-5 years');

  const loadPosts = () => fetch('/api/community').then((r) => r.json()).then((d) => setPosts(d.posts || []));
  const loadMeetups = () => fetch('/api/meetups').then((r) => r.json()).then((d) => setMeetups(d.meetups || []));

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      loadPosts();
      loadMeetups();
    }
  }, [status, router]);

  useEffect(() => {
    setTab(tabFromParams(searchParams.get('tab')));
  }, [searchParams]);

  const switchTab = (next: CommunityTab) => {
    setTab(next);
    setActiveThreadId(null);
    router.replace(`/community?tab=${next}`, { scroll: false });
  };

  const openChat = (threadId: string) => {
    setActiveThreadId(threadId);
    setTab('chats');
  };

  const handleCreatePost = async () => {
    if (!title.trim() || !content.trim()) return;
    await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: postType, title, content, isAnonymous }),
    });
    setTitle('');
    setContent('');
    setShowForm(false);
    loadPosts();
  };

  const handleCreateMeetup = async () => {
    if (!meetupTitle.trim() || !meetupDate || !meetupTime || !meetupLocation.trim()) return;
    await fetch('/api/meetups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: meetupTitle,
        date: meetupDate,
        time: meetupTime,
        location: meetupLocation,
        childAgeRange,
      }),
    });
    setMeetupTitle('');
    setMeetupDate('');
    setMeetupTime('');
    setMeetupLocation('');
    setShowForm(false);
    loadMeetups();
  };

  const handleJoinMeetup = async (id: string) => {
    await fetch(`/api/meetups/${id}/join`, { method: 'POST' });
    loadMeetups();
  };

  if (activeThreadId && session?.user?.id) {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-4">
          <ParentChatRoom
            threadId={activeThreadId}
            currentUserId={session.user.id}
            onBack={() => {
              setActiveThreadId(null);
              setChatsRefresh((k) => k + 1);
            }}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Parent Community</h1>
          </div>
          {(tab === 'posts' || tab === 'meetups') && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={tab === 'posts' ? 'default' : 'outline'} className="rounded-full" onClick={() => switchTab('posts')}>
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            Posts
          </Button>
          <Button size="sm" variant={tab === 'meetups' ? 'default' : 'outline'} className="rounded-full" onClick={() => switchTab('meetups')}>
            <Coffee className="h-3.5 w-3.5 mr-1" />
            Coffee Walks
          </Button>
          <Button size="sm" variant={tab === 'connect' ? 'default' : 'outline'} className="rounded-full" onClick={() => switchTab('connect')}>
            <Heart className="h-3.5 w-3.5 mr-1" />
            Connect
          </Button>
          <Button size="sm" variant={tab === 'chats' ? 'default' : 'outline'} className="rounded-full" onClick={() => switchTab('chats')}>
            <MessagesSquare className="h-3.5 w-3.5 mr-1" />
            Chats
          </Button>
        </div>

        {showForm && tab === 'posts' && (
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(POST_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share with the community..." />
              <div className="flex items-center gap-2">
                <Checkbox id="anon" checked={isAnonymous} onCheckedChange={(c) => setIsAnonymous(!!c)} />
                <Label htmlFor="anon" className="text-sm">Post anonymously</Label>
              </div>
              <Button onClick={handleCreatePost} className="w-full rounded-xl">Post</Button>
            </CardContent>
          </Card>
        )}

        {showForm && tab === 'meetups' && (
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <Input value={meetupTitle} onChange={(e) => setMeetupTitle(e.target.value)} placeholder="Coffee meetup, park walk..." />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={meetupDate} onChange={(e) => setMeetupDate(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Time</Label>
                  <Input type="time" value={meetupTime} onChange={(e) => setMeetupTime(e.target.value)} />
                </div>
              </div>
              <Input value={meetupLocation} onChange={(e) => setMeetupLocation(e.target.value)} placeholder="Location" />
              <Input value={childAgeRange} onChange={(e) => setChildAgeRange(e.target.value)} placeholder="Child age range" />
              <Button onClick={handleCreateMeetup} className="w-full rounded-xl">Create Meetup</Button>
            </CardContent>
          </Card>
        )}

        {tab === 'connect' && (
          <ParentConnectPanel
            onOpenChat={openChat}
            onRequestsChange={() => setChatsRefresh((k) => k + 1)}
          />
        )}

        {tab === 'chats' && (
          <ParentChatsPanel onOpenChat={openChat} refreshKey={chatsRefresh} />
        )}

        {tab === 'posts' && (
          posts.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                No posts yet. Be the first to share!
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs rounded-full">
                      {POST_TYPES[post.type]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{post.authorName}</span>
                  </div>
                  <h3 className="font-medium text-sm mb-1">{post.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{post.content}</p>
                </CardContent>
              </Card>
            ))
          )
        )}

        {tab === 'meetups' && (
          meetups.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                No upcoming meetups. Create a coffee walk or playground visit!
              </CardContent>
            </Card>
          ) : (
            meetups.map((meetup) => (
              <Card key={meetup.id} className="rounded-2xl">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm mb-1">{meetup.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {format(new Date(meetup.date), 'EEE, MMM d')} · {meetup.time} · {meetup.location}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Ages: {meetup.childAgeRange} · {meetup._count.attendees}/{meetup.maxAttendees} joined
                  </p>
                  {session && (
                    <Button size="sm" className="rounded-xl" onClick={() => handleJoinMeetup(meetup.id)}>
                      Join
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )
        )}
      </div>
    </AppShell>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground">Loading...</div>}>
      <CommunityContent />
    </Suspense>
  );
}
