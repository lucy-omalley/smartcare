'use client';

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Bot, User } from "lucide-react";
import { useEffect } from "react";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  matchedKeywords?: string[];
}

export function ChatMessage({ message, isUser, timestamp, matchedKeywords = [] }: ChatMessageProps) {
  useEffect(() => {
    console.log('ChatMessage rendered:', { message, isUser, timestamp, matchedKeywords });
  }, [message, isUser, timestamp, matchedKeywords]);

  const highlightKeywords = (text: string) => {
    if (!matchedKeywords.length) return text;
    
    const parts = text.split(new RegExp(`(${matchedKeywords.join('|')})`, 'gi'));
    return parts.map((part, index) => 
      matchedKeywords.some(keyword => 
        keyword.toLowerCase() === part.toLowerCase()
      ) ? (
        <span key={index} className="font-medium">
          {part}
        </span>
      ) : part
    );
  };

  return (
    <div
      className={cn(
        "flex w-full gap-2 mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "group relative max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-muted rounded-bl-none"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {highlightKeywords(message)}
        </p>
        <div
          className={cn(
            "mt-1 text-xs opacity-70 flex items-center gap-1",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          <span>{format(timestamp, "HH:mm")}</span>
          {isUser && (
            <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="h-2.5 w-2.5" />
            </div>
          )}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </div>
  );
}
 