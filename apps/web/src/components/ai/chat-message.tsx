'use client';

import * as React from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@ccd/ui';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3 px-4 py-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <Bot className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-emerald-500 animate-pulse rounded-sm" />
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}
    </div>
  );
}
