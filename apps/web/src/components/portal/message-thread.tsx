'use client';

import * as React from 'react';
import { Badge, Button, CcdSpinner } from '@ccd/ui';
import { Send, Trash2 } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

interface Message {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  sender_id: string | null;
  sender_email?: string | null;
  sender?: { id: string; full_name: string | null; email: string | null; avatar_url: string | null } | null;
}

interface MessageThreadProps {
  projectId: string;
  refreshKey?: number;
}

export function MessageThread({ projectId, refreshKey }: MessageThreadProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [messageText, setMessageText] = React.useState('');
  const [isInternal, setIsInternal] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const loadMessages = React.useCallback(async () => {
    try {
      const res = await apiGet<Message[]>(`/api/portal/projects/${projectId}/messages?limit=100`);
      setMessages(res.data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    loadMessages();
  }, [loadMessages, refreshKey]);

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Poll for new messages every 30s
  React.useEffect(() => {
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  async function handleSend() {
    if (!messageText.trim()) return;
    setSending(true);
    try {
      await apiPost(`/api/portal/projects/${projectId}/messages`, {
        content: messageText.trim(),
        is_internal: isInternal,
      });
      setMessageText('');
      setIsInternal(false);
      await loadMessages();
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(messageId: string) {
    setDeleting(messageId);
    try {
      await apiDelete(`/api/portal/projects/${projectId}/messages/${messageId}`);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <CcdSpinner size="lg" />
      </div>
    );
  }

  // Show messages oldest first (API returns newest first)
  const sortedMessages = [...messages].reverse();

  return (
    <div className="space-y-4">
      <div ref={scrollRef} className="space-y-3 max-h-[400px] overflow-y-auto">
        {sortedMessages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet. Start a conversation.
          </p>
        ) : (
          sortedMessages.map((msg) => (
            <div key={msg.id} className="flex gap-3 group">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                {(msg.sender?.full_name ?? msg.sender_email ?? 'U').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{msg.sender?.full_name ?? msg.sender_email ?? 'Unknown'}</span>
                  {msg.is_internal && (
                    <Badge variant="outline" className="text-xs">Internal</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                    })}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(msg.id)}
                    disabled={deleting === msg.id}
                  >
                    {deleting === msg.id ? <CcdSpinner size="sm" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-sm mt-0.5 whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Compose */}
      <div className="space-y-2 pt-2 border-t">
        <textarea
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex justify-between">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="rounded"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
            />
            Internal note (hidden from client)
          </label>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={sending || !messageText.trim()}
          >
            {sending ? <CcdSpinner size="sm" className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
