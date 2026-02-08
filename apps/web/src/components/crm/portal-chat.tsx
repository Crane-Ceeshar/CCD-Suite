'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, UserAvatar, Badge, CcdLoader } from '@ccd/ui';
import { Send, Loader2, Lock, Globe, MessageSquare } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

interface ChatMessage {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface PortalChatProps {
  portalProjectId: string;
  className?: string;
}

export function PortalChat({ portalProjectId, className }: PortalChatProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newMessage, setNewMessage] = React.useState('');
  const [isInternal, setIsInternal] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const loadMessages = React.useCallback(async () => {
    try {
      const res = await apiGet<ChatMessage[]>(
        `/api/portal/messages?portal_project_id=${portalProjectId}`
      );
      setMessages(res.data);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [portalProjectId]);

  React.useEffect(() => {
    loadMessages();
    // Poll for new messages every 10 seconds
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await apiPost('/api/portal/messages', {
        portal_project_id: portalProjectId,
        content: newMessage.trim(),
        is_internal: isInternal,
      });
      setNewMessage('');
      loadMessages();
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages list */}
        <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <CcdLoader size="lg" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.is_internal ? 'opacity-75' : ''}`}
              >
                <UserAvatar
                  name={msg.sender?.full_name ?? 'Unknown'}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {msg.sender?.full_name ?? 'Unknown'}
                    </span>
                    {msg.is_internal ? (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Lock className="h-2.5 w-2.5" />
                        Internal
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Globe className="h-2.5 w-2.5" />
                        Client
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Compose */}
        <form onSubmit={handleSend} className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isInternal ? 'Internal note...' : 'Message to client...'}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              type="button"
              variant={isInternal ? 'secondary' : 'outline'}
              size="sm"
              className="text-xs shrink-0"
              onClick={() => setIsInternal(!isInternal)}
            >
              {isInternal ? (
                <>
                  <Lock className="mr-1 h-3 w-3" />
                  Internal
                </>
              ) : (
                <>
                  <Globe className="mr-1 h-3 w-3" />
                  Client
                </>
              )}
            </Button>
          </div>
          <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
