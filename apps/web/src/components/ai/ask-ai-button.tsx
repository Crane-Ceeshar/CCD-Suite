'use client';

import * as React from 'react';
import { Sparkles, X, Send, Minimize2 } from 'lucide-react';
import { Button, Card, CcdSpinner } from '@ccd/ui';
import { ChatMessage } from './chat-message';
import { apiPost, apiStream } from '@/lib/api';
import type { AiMessage } from '@ccd/shared';

interface AskAiButtonProps {
  moduleContext: string;
  entityContext?: {
    entity_type: string;
    entity_id: string;
    entity_data?: Record<string, unknown>;
  };
}

export function AskAiButton({ moduleContext, entityContext }: AskAiButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<AiMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [streamingContent, setStreamingContent] = React.useState('');
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const streamContentRef = React.useRef('');

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;
    const userContent = input.trim();
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    streamContentRef.current = '';

    // Optimistic user message
    const userMsg: AiMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId ?? '',
      role: 'user',
      content: userContent,
      tokens_used: null,
      model: null,
      metadata: {},
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const requestBody = {
      content: userContent,
      conversation_id: conversationId ?? undefined,
      module_context: moduleContext,
      entity_context: entityContext,
    };

    try {
      let streamError = false;
      await apiStream(
        '/api/ai/chat/stream',
        requestBody,
        (text) => {
          streamContentRef.current += text;
          setStreamingContent(streamContentRef.current);
        },
        (meta) => {
          const assistantMsg: AiMessage = {
            id: `temp-${Date.now()}-assistant`,
            conversation_id: meta.conversation_id ?? conversationId ?? '',
            role: 'assistant',
            content: streamContentRef.current,
            tokens_used: meta.tokens_used,
            model: meta.model,
            metadata: {},
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingContent('');
          streamContentRef.current = '';

          if (!conversationId && meta.conversation_id) {
            setConversationId(meta.conversation_id);
          }
        },
        () => {
          streamError = true;
        }
      );

      if (streamError) {
        throw new Error('Stream failed');
      }
    } catch {
      // Fallback to non-streaming
      setStreamingContent('');
      streamContentRef.current = '';
      try {
        const res = await apiPost<{
          conversation_id: string;
          message: { role: string; content: string; model: string; tokens_used: number | null };
        }>('/api/ai/chat', requestBody);

        if (!conversationId) {
          setConversationId(res.data.conversation_id);
        }

        const assistantMsg: AiMessage = {
          id: `temp-${Date.now()}-assistant`,
          conversation_id: res.data.conversation_id,
          role: 'assistant',
          content: res.data.message.content,
          tokens_used: res.data.message.tokens_used,
          model: res.data.message.model,
          metadata: {},
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        const errorMsg: AiMessage = {
          id: `temp-${Date.now()}-error`,
          conversation_id: '',
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          tokens_used: null,
          model: null,
          metadata: {},
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsLoading(false);
      setStreamingContent('');
      streamContentRef.current = '';
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-all hover:scale-105"
        title="Ask AI"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-96 shadow-2xl flex flex-col" style={{ height: '500px' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-emerald-50 dark:bg-emerald-950 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <span className="font-medium text-sm">
            Ask AI — {moduleContext.charAt(0).toUpperCase() + moduleContext.slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsOpen(false)}
            className="rounded p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
            <Sparkles className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm text-center">
              Ask me anything about your {moduleContext} data
            </p>
          </div>
        ) : (
          <div className="py-2">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role as 'user' | 'assistant'}
                content={msg.content}
              />
            ))}
            {isLoading && streamingContent && (
              <ChatMessage role="assistant" content={streamingContent} isStreaming />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[38px] max-h-[80px]"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-9 w-9 rounded-lg bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? (
              <CcdSpinner size="sm" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
