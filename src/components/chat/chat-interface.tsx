'use client';

import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { Bot, Menu, X } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { ThemeSelector } from '@/components/theme/theme-selector';
import { messagesAtom, type ChatMessage as ChatMessageType } from '@/lib/store/chat';
import { cn } from '@/lib/utils';
import { generateWelcomeMessage } from '@/lib/mumbot-messages';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

interface SuggestedMemory {
  content: string;
  category: string;
}

export function ChatInterface() {
  const { data: session } = useSession();
  const [messages, setMessages] = useAtom(messagesAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingMemory, setPendingMemory] = useState<SuggestedMemory | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        content: generateWelcomeMessage(session?.user?.name),
        isUser: false,
        timestamp: new Date(),
      }]);
    }
  }, [messages.length, setMessages, session?.user?.name]);

  useEffect(() => {
    if (!session?.user) return;

    fetch('/api/chat')
      .then((r) => r.json())
      .then((data) => {
        if (data.conversation?.messages?.length > 0) {
          setConversationId(data.conversation.id);
          setMessages(
            data.conversation.messages.map((m: { id: string; content: string; isUser: boolean; createdAt: string }) => ({
              id: m.id,
              content: m.content,
              isUser: m.isUser,
              timestamp: new Date(m.createdAt),
            }))
          );
        }
      })
      .catch(() => {});
  }, [session?.user, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTypingIndicator, pendingMemory]);

  useEffect(() => {
    if (isLoading) {
      setShowTypingIndicator(true);
    } else {
      const timer = setTimeout(() => setShowTypingIndicator(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleRemember = async () => {
    if (!pendingMemory) return;
    try {
      await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingMemory),
      });
      setPendingMemory(null);
    } catch {
      // silently fail
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      setIsLoading(true);
      setPendingMemory(null);

      const userMessage: ChatMessageType = {
        id: Date.now().toString(),
        content,
        isUser: true,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, conversationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const aiMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (data.suggestedMemory && session?.user) {
        setPendingMemory(data.suggestedMemory);
      }
    } catch (error) {
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: error instanceof Error ? error.message : 'I apologize, but I encountered an error. Please try again later.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[700px] w-full max-w-2xl mx-auto border rounded-2xl bg-background shadow-lg overflow-hidden">
      <div className="border-b p-4 bg-muted/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-semibold">MumBot</h3>
            <p className="text-sm text-muted-foreground">Your AI Co-Parent</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSelector />
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-9 px-3"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/20">
        {messages.map((message) => (
          <div key={message.id} className="w-full">
            <ChatMessage
              message={message.content}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          </div>
        ))}
        <TypingIndicator isVisible={showTypingIndicator} />
        <div ref={messagesEndRef} />
      </div>

      {pendingMemory && (
        <div className="border-t bg-accent/30 p-4 space-y-3">
          <p className="text-sm font-medium">
            Would you like me to remember that?
          </p>
          <p className="text-sm text-muted-foreground italic">
            &ldquo;{pendingMemory.content}&rdquo;
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleRemember}>
              Remember
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPendingMemory(null)}>
              Not now
            </Button>
          </div>
        </div>
      )}

      <div className="border-t bg-background p-4">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
