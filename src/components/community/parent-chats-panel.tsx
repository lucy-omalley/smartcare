'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ThreadItem {
  id: string;
  other: { id: string; name: string; location?: string | null };
  lastMessage: { content: string; createdAt: string; isMine: boolean } | null;
  updatedAt: string;
}

interface ConnectionRequest {
  id: string;
  status: string;
  introMessage?: string | null;
  isRequester: boolean;
  other: { id: string; name: string; location?: string | null; childAge?: string | null };
  threadId: string | null;
  updatedAt: string;
}

interface ParentChatsPanelProps {
  onOpenChat: (threadId: string) => void;
  refreshKey?: number;
}

export function ParentChatsPanel({ onOpenChat, refreshKey }: ParentChatsPanelProps) {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [pendingReceived, setPendingReceived] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [handlingId, setHandlingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/parents/threads').then((r) => r.json()),
      fetch('/api/parents/connections').then((r) => r.json()),
    ])
      .then(([threadsData, connData]) => {
        setThreads(threadsData.threads || []);
        setPendingReceived(connData.pendingReceived || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleRequest = async (id: string, action: 'accept' | 'decline') => {
    setHandlingId(id);
    try {
      const res = await fetch(`/api/parents/connections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not update request');
        return;
      }
      toast.success(action === 'accept' ? 'Connected! You can chat now.' : 'Request declined');
      load();
      if (action === 'accept' && data.threadId) {
        onOpenChat(data.threadId);
      }
    } finally {
      setHandlingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingReceived.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-1">
            Connection requests ({pendingReceived.length})
          </p>
          {pendingReceived.map((req) => (
            <Card key={req.id} className="rounded-2xl border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold">{req.other.name}</h3>
                  {req.other.location && (
                    <p className="text-xs text-muted-foreground">{req.other.location}</p>
                  )}
                </div>
                {req.introMessage && (
                  <p className="text-sm text-muted-foreground italic">&ldquo;{req.introMessage}&rdquo;</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 rounded-xl"
                    disabled={handlingId === req.id}
                    onClick={() => handleRequest(req.id, 'accept')}
                  >
                    <Check className="h-4 w-4 mr-1" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-xl"
                    disabled={handlingId === req.id}
                    onClick={() => handleRequest(req.id, 'decline')}
                  >
                    <X className="h-4 w-4 mr-1" /> Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {threads.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            No chats yet. Find parents in Connect and send a request to start chatting.
          </CardContent>
        </Card>
      ) : (
        threads.map((thread) => (
          <Card
            key={thread.id}
            className="rounded-2xl cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => onOpenChat(thread.id)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold truncate">{thread.other.name}</h3>
                  {thread.lastMessage && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(thread.lastMessage.createdAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
                {thread.other.location && (
                  <p className="text-xs text-muted-foreground truncate">{thread.other.location}</p>
                )}
                {thread.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {thread.lastMessage.isMine ? 'You: ' : ''}{thread.lastMessage.content}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
