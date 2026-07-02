'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ChatInput } from '@/components/chat/chat-input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string };
}

interface ParentChatRoomProps {
  threadId: string;
  currentUserId: string;
  onBack: () => void;
}

export function ParentChatRoom({ threadId, currentUserId, onBack }: ParentChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherName, setOtherName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(() => {
    fetch(`/api/parents/threads/${threadId}`)
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages || []);
        setOtherName(d.thread?.other?.name || 'Parent');
      })
      .finally(() => setLoading(false));
  }, [threadId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    setSending(true);
    try {
      const res = await fetch(`/api/parents/threads/${threadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const { message } = await res.json();
        setMessages((prev) => [...prev, message]);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[600px] -mx-4">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <Button size="icon" variant="ghost" className="rounded-full shrink-0" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="font-semibold leading-tight">{otherName}</p>
          <p className="text-xs text-muted-foreground">Parent chat · updates every few seconds</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Say hello to start the conversation!</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender.id === currentUserId;
            return (
              <div key={msg.id} className={cn('flex w-full mb-3', isMine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm',
                    isMine ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'
                  )}
                >
                  {!isMine && (
                    <p className="text-[10px] font-medium opacity-70 mb-0.5">{msg.sender.name.split(' ')[0]}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                  <p className={cn('text-[10px] mt-1 opacity-60', isMine ? 'text-right' : 'text-left')}>
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSendMessage={sendMessage} disabled={sending} />
    </div>
  );
}
