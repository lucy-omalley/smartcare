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
import { MatchingService } from '@/lib/services/matching';

const WELCOME_MESSAGE = {
  id: 'welcome',
  content: MatchingService.generateWelcomeMessage(),
  isUser: false,
  timestamp: new Date(),
};

// Add keyword extraction function
const extractKeywords = (message: string): string[] => {
  // Define keyword categories
  const keywordCategories = {
    careTypes: [
      'creche', 'childminder', 'childcare', 'care', 'nanny', 'daycare',
      'preschool', 'kindergarten', 'after school', 'babysitter'
    ],
    days: [
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
      'saturday', 'sunday', 'weekday', 'weekend'
    ],
    timePeriods: [
      'morning', 'afternoon', 'evening', 'night',
      'full day', 'half day', 'part time', 'full time'
    ],
    specialNeeds: [
      'special needs', 'autism', 'adhd', 'disability',
      'learning difficulties', 'developmental delay'
    ],
    languages: [
      'english', 'irish', 'polish', 'chinese', 'french',
      'spanish', 'portuguese', 'multilingual', 'bilingual'
    ],
    locations: [
      'dublin', 'dundrum', 'swords', 'dun laoghaire', 'tallaght',
      'blanchardstown', 'sandyford', 'clontarf', 'rathmines', 'malahide'
    ],
    requirements: [
      'certified', 'qualified', 'experienced', 'first aid',
      'emergency', 'flexible', 'reliable', 'trusted'
    ]
  };

  // Convert message to lowercase for case-insensitive matching
  const lowerMessage = message.toLowerCase();

  // Function to find exact word matches
  const findExactMatches = (word: string): boolean => {
    // Create a regex that matches word boundaries
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerMessage);
  };

  // Function to find phrase matches
  const findPhraseMatches = (phrase: string): boolean => {
    return lowerMessage.includes(phrase.toLowerCase());
  };

  // Collect all matched keywords
  const matchedKeywords: string[] = [];

  // Check each category
  Object.entries(keywordCategories).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      // For single words, use exact matching
      if (!keyword.includes(' ')) {
        if (findExactMatches(keyword)) {
          matchedKeywords.push(keyword);
        }
      } else {
        // For phrases, use phrase matching
        if (findPhraseMatches(keyword)) {
          matchedKeywords.push(keyword);
        }
      }
    });
  });

  // Remove duplicates and sort by length (longer matches first)
  return Array.from(new Set(matchedKeywords)).sort((a, b) => b.length - a.length);
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
      console.log('Sending message:', content);

      // Add user message
      const userMessage: ChatMessageType = {
        id: Date.now().toString(),
        content,
        isUser: true,
        timestamp: new Date(),
      };

      // Update messages with user message
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      console.log('Updated messages with user message:', updatedMessages);

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      console.log('Received AI response:', data);
      
      if (!data.response) {
        console.error('No response in data:', data);
        throw new Error('No response received from the server');
      }

      // Add AI response
      const aiMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date(),
      };

      console.log('Adding AI message:', aiMessage);
      // Update messages with AI response
      setMessages((prev) => {
        const newMessages = [...prev, aiMessage];
        console.log('Updated messages with AI response:', newMessages);
        return newMessages;
      });
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      // Add error message
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: error instanceof Error ? error.message : 'I apologize, but I encountered an error. Please try again later.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const newMessages = [...prev, errorMessage];
        console.log('Updated messages with error:', newMessages);
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add debug logging for messages changes
  useEffect(() => {
    console.log('Messages updated:', messages);
  }, [messages]);

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
        style={{ minHeight: '400px' }}
      >
        <div className="flex flex-col space-y-4">
          {messages.map((message) => {
            console.log('Rendering message:', message);
            const matchedKeywords = extractKeywords(message.content);
            return (
              <div key={message.id} className="w-full">
                <ChatMessage
                  message={message.content}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                  matchedKeywords={matchedKeywords}
                />
              </div>
            );
          })}
        </div>
        <TypingIndicator isVisible={showTypingIndicator} />
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t bg-background p-4">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
} 