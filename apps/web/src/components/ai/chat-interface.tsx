'use client';

import * as React from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button, Card, CcdLoader, CcdSpinner } from '@ccd/ui';
import { ChatMessage } from './chat-message';
import { ConversationSidebar } from './conversation-sidebar';
import { useAIStore } from '@/stores/ai-store';
import { apiGet, apiPost, apiDelete, apiStream } from '@/lib/api';
import type { AiConversation, AiMessage } from '@ccd/shared';

interface ChatInterfaceProps {
  moduleContext?: string;
  entityContext?: {
    entity_type: string;
    entity_id: string;
    entity_data?: Record<string, unknown>;
  };
  compact?: boolean;
}

export function ChatInterface({ moduleContext, entityContext, compact }: ChatInterfaceProps) {
  const {
    conversations,
    activeConversationId,
    messages,
    isStreaming,
    isLoading,
    streamingContent,
    setConversations,
    setActiveConversationId,
    setMessages,
    addMessage,
    setIsStreaming,
    setIsLoading,
    setStreamingContent,
    appendStreamingContent,
    reset,
  } = useAIStore();

  const [input, setInput] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const loadConversations = React.useCallback(async function () {
    try {
      const res = await apiGet<AiConversation[]>('/api/ai/conversations');
      setConversations(res.data);
    } catch {
      // Silently fail — will show empty sidebar
    }
  }, [setConversations]);

  // Load conversations on mount
  React.useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  async function loadMessages(conversationId: string) {
    setIsLoading(true);
    try {
      const res = await apiGet<AiConversation & { ai_messages: AiMessage[] }>(
        `/api/ai/conversations/${conversationId}`
      );
      setMessages(res.data.ai_messages ?? []);
    } catch {
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectConversation(id: string) {
    setActiveConversationId(id);
    loadMessages(id);
  }

  function handleNewConversation() {
    reset();
  }

  async function handleDeleteConversation(id: string) {
    try {
      await apiDelete(`/api/ai/conversations/${id}`);
      setConversations(conversations.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        reset();
      }
    } catch {
      // Silently fail
    }
  }

  async function handleSend() {
    if (!input.trim() || isStreaming) return;

    const userContent = input.trim();
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');

    // Add user message optimistically
    const userMsg: AiMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversationId ?? '',
      role: 'user',
      content: userContent,
      tokens_used: null,
      model: null,
      metadata: {},
      created_at: new Date().toISOString(),
    };
    addMessage(userMsg);

    const requestBody = {
      content: userContent,
      conversation_id: activeConversationId ?? undefined,
      module_context: moduleContext,
      entity_context: entityContext,
    };

    try {
      // Primary: streaming endpoint for real-time token-by-token responses
      let streamError = false;
      await apiStream(
        '/api/ai/chat/stream',
        requestBody,
        (text) => {
          appendStreamingContent(text);
        },
        (meta) => {
          // Stream complete — create assistant message from accumulated content
          const finalContent = useAIStore.getState().streamingContent;
          const assistantMsg: AiMessage = {
            id: `temp-${Date.now()}-assistant`,
            conversation_id: meta.conversation_id ?? activeConversationId ?? '',
            role: 'assistant',
            content: finalContent,
            tokens_used: meta.tokens_used,
            model: meta.model,
            metadata: {},
            created_at: new Date().toISOString(),
          };
          addMessage(assistantMsg);
          setStreamingContent('');

          // Set conversation ID if new
          if (!activeConversationId && meta.conversation_id) {
            setActiveConversationId(meta.conversation_id);
            loadConversations();
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
      // Fallback: non-streaming endpoint for reliability
      setStreamingContent('');
      try {
        const res = await apiPost<{
          conversation_id: string;
          message: { role: string; content: string; model: string; tokens_used: number | null };
        }>('/api/ai/chat', requestBody);

        if (!activeConversationId) {
          setActiveConversationId(res.data.conversation_id);
          loadConversations();
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
        addMessage(assistantMsg);
      } catch {
        const errMsg: AiMessage = {
          id: `temp-${Date.now()}-error`,
          conversation_id: activeConversationId ?? '',
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          tokens_used: null,
          model: null,
          metadata: {},
          created_at: new Date().toISOString(),
        };
        addMessage(errMsg);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={`flex ${compact ? 'h-[500px]' : 'h-[calc(100vh-12rem)]'}`}>
      {/* Sidebar */}
      {!compact && (
        <div className="w-64 flex-shrink-0">
          <ConversationSidebar
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={handleSelectConversation}
            onNew={handleNewConversation}
            onDelete={handleDeleteConversation}
          />
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Sparkles className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-1">How can I help you?</p>
              <p className="text-sm">
                Ask me anything about your agency data, or request content generation.
              </p>
            </div>
          ) : isLoading ? (
            <div className="h-full flex items-center justify-center">
              <CcdLoader size="lg" />
            </div>
          ) : (
            <div className="py-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role as 'user' | 'assistant'}
                  content={msg.content}
                />
              ))}
              {isStreaming && streamingContent && (
                <ChatMessage role="assistant" content={streamingContent} isStreaming />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px] max-h-[120px]"
              rows={1}
              disabled={isStreaming}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="h-11 w-11 rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              {isStreaming ? (
                <CcdSpinner size="sm" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
