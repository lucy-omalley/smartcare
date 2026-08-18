'use client';

import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bot, Menu, X, UtensilsCrossed, BookOpen, Puzzle, Users, HeartHandshake } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { ThemeSelector } from '@/components/theme/theme-selector';
import { messagesAtom, type ChatMessage as ChatMessageType } from '@/lib/store/chat';
import { generateWelcomeMessage } from '@/lib/mumbot-messages';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { trackEvent, trackClientError } from '@/lib/analytics';
import { useTranslation } from '@/hooks/use-translation';
import { useAtomValue } from 'jotai';
import { localeAtom } from '@/lib/store/locale';

interface SuggestedMemory {
  content: string;
  category: string;
}

const ACTION_CARD_KEYS = [
  { id: 'meal', labelKey: 'mumbot.suggested.mealToday', promptKey: 'mumbot.suggested.mealToday', icon: UtensilsCrossed },
  { id: 'story', labelKey: 'home.stories', promptKey: 'mumbot.suggested.playToday', icon: BookOpen },
  { id: 'activity', labelKey: 'home.activities', promptKey: 'mumbot.suggested.playToday', icon: Puzzle },
  { id: 'connect', labelKey: 'nav.connect', href: '/connect', icon: Users },
  { id: 'checkin', labelKey: 'home.todaysJourney', href: '/today', icon: HeartHandshake },
] as const;

export function ChatInterface() {
  const { data: session } = useSession();
  const locale = useAtomValue(localeAtom);
  const { t } = useTranslation();
  const [messages, setMessages] = useAtom(messagesAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingMemory, setPendingMemory] = useState<SuggestedMemory | null>(null);
  const [showActions, setShowActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessageRef = useRef<(content: string) => Promise<void>>();

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        content: generateWelcomeMessage(session?.user?.name, locale),
        isUser: false,
        timestamp: new Date(),
      }]);
    }
  }, [messages.length, setMessages, session?.user?.name, locale]);

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
  }, [messages, showTypingIndicator, pendingMemory, showActions]);

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
      setShowActions(false);
      trackEvent('mumbot_question_asked');
      const lower = content.toLowerCase();
      if (/meal|recipe|food|dinner|lunch/.test(lower)) trackEvent('mumbot_recipe_generated');
      if (/story|bedtime|tale/.test(lower)) trackEvent('mumbot_story_generated');
      if (/activity|play|game/.test(lower)) trackEvent('mumbot_activity_generated');

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
        body: JSON.stringify({
          messages: updatedMessages
            .filter((m) => m.id !== 'welcome')
            .map((m) => ({ content: m.content, isUser: m.isUser, id: m.id })),
          conversationId,
        }),
      });

      const responseText = await response.text();
      let data: { response?: string; conversationId?: string; suggestedMemory?: SuggestedMemory; error?: string };
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(`Server returned an invalid response (${response.status})`);
      }

      if (!response.ok) {
        const friendly =
          data.error ||
          (response.status === 429
            ? 'MumBot is taking a short break. Please try again in a moment.'
            : 'MumBot is taking a short break. Please try again in a moment.');
        throw new Error(friendly);
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const aiMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: data.response ?? 'Sorry, I could not generate a response.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setShowActions(true);

      if (data.suggestedMemory && session?.user) {
        setPendingMemory(data.suggestedMemory);
      }
    } catch (error) {
      trackClientError('mumbot_chat', error instanceof Error ? error.message : 'Chat failed');
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content:
          error instanceof Error
            ? error.message
            : 'MumBot is taking a short break. Please try again in a moment.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  sendMessageRef.current = handleSendMessage;

  useEffect(() => {
    const prefill = sessionStorage.getItem('mumbot_prefill');
    if (!prefill || !session?.user) return;
    sessionStorage.removeItem('mumbot_prefill');
    void sendMessageRef.current?.(prefill);
  }, [session?.user]);

  const lastMessage = messages[messages.length - 1];
  const showActionCards = showActions && lastMessage && !lastMessage.isUser && !isLoading;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[700px] w-full max-w-2xl mx-auto border rounded-2xl bg-background shadow-lg overflow-hidden">
      <div className="border-b p-4 bg-muted/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-semibold">MumBot</h3>
            <p className="text-sm text-muted-foreground">Ask anything about parenting</p>
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

      <p className="text-xs text-muted-foreground px-4 py-2 bg-muted/30 border-b">
        Parenfy provides general parenting support and does not replace professional advice.
      </p>

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

        {showActionCards && (
          <div className="flex flex-wrap gap-2 pt-1">
            {ACTION_CARD_KEYS.map(({ id, labelKey, icon: Icon, ...rest }) =>
              'href' in rest ? (
                <Link key={id} href={rest.href}>
                  <Button size="sm" variant="outline" className="rounded-full text-xs h-8">
                    <Icon className="h-3.5 w-3.5 mr-1" /> {t(labelKey)}
                  </Button>
                </Link>
              ) : (
                <Button
                  key={id}
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs h-8"
                  onClick={() => {
                    trackEvent('mumbot_followup_clicked', { action: id });
                    void handleSendMessage(t(rest.promptKey));
                  }}
                >
                  <Icon className="h-3.5 w-3.5 mr-1" /> {t(labelKey)}
                </Button>
              )
            )}
          </div>
        )}

        <TypingIndicator isVisible={showTypingIndicator} />
        <div ref={messagesEndRef} />
      </div>

      {pendingMemory && (
        <div className="border-t bg-accent/30 p-4 space-y-3">
          <p className="text-sm font-medium">Would you like me to remember that?</p>
          <p className="text-sm text-muted-foreground italic">&ldquo;{pendingMemory.content}&rdquo;</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleRemember}>Remember</Button>
            <Button size="sm" variant="outline" onClick={() => setPendingMemory(null)}>Not now</Button>
          </div>
        </div>
      )}

      <div className="border-t bg-background p-4">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
