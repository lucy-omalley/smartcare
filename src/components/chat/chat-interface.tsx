'use client';

import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { Bot, Menu, Send, User, X } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { ThemeSelector } from '@/components/theme/theme-selector';
import { messagesAtom, type ChatMessage as ChatMessageType } from '@/lib/store/chat';
import { cn } from '@/lib/utils';

const WELCOME_MESSAGE = {
  id: 'welcome',
  content: "Hello! I'm MumBot, your AI childcare assistant. I can help you find the perfect childcare solution in Ireland. What kind of care are you looking for?",
  isUser: false,
  timestamp: new Date(),
};

export function ChatInterface() {
  const [messages, setMessages] = useAtom(messagesAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add welcome message if chat is empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([WELCOME_MESSAGE]);
    }
  }, [messages.length, setMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTypingIndicator]);

  // Handle typing indicator visibility with a slight delay
  useEffect(() => {
    if (isLoading) {
      setShowTypingIndicator(true);
    } else {
      const timer = setTimeout(() => {
        setShowTypingIndicator(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && !(event.target as Element).closest('.mobile-menu')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleSendMessage = async (content: string) => {
    try {
      setIsLoading(true);

      // Add user message
      const userMessage: ChatMessageType = {
        id: Date.now().toString(),
        content,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Add AI response
      const aiMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error. Please try again later.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] md:h-[700px] w-full max-w-2xl mx-auto border rounded-lg bg-background shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="border-b p-4 bg-muted/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-semibold">MumBot SmartCare</h3>
            <p className="text-sm text-muted-foreground">AI Childcare Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSelector />
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "mobile-menu fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-200",
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="fixed right-0 top-0 h-full w-64 bg-background border-l shadow-lg transform transition-transform duration-200 ease-in-out"
             style={{ transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)' }}>
          <div className="p-4 space-y-4">
            <h3 className="font-semibold">Settings</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Theme</label>
              <ThemeSelector />
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/30"
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message.content}
            isUser={message.isUser}
            timestamp={message.timestamp}
          />
        ))}
        <TypingIndicator isVisible={showTypingIndicator} />
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t bg-background">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
} 