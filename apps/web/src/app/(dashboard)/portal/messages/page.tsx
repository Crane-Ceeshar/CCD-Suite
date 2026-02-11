'use client';

import * as React from 'react';
import { PageHeader, Card, CardContent, Input, ScrollArea, CcdSpinner, cn } from '@ccd/ui';
import { MessageSquare, Search, ArrowLeft } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { MessageThread } from '@/components/portal/message-thread';

interface PortalProject {
  id: string;
  name: string;
}

interface MessagePreview {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  sender_id: string | null;
  sender_email?: string | null;
  sender?: { id: string; full_name: string | null; email: string | null } | null;
}

interface ProjectConversation {
  project: PortalProject;
  lastMessage: MessagePreview | null;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MessagesPage() {
  const [conversations, setConversations] = React.useState<ProjectConversation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [mobileShowThread, setMobileShowThread] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        const projectsRes = await apiGet<PortalProject[]>('/api/portal/projects?limit=100');
        const projectList = projectsRes.data ?? [];

        // Fetch latest message for each project in parallel
        const conversationPromises = projectList.map(async (project) => {
          try {
            const res = await apiGet<MessagePreview[]>(
              `/api/portal/projects/${project.id}/messages?limit=1`
            );
            const msgs = res.data ?? [];
            return {
              project,
              lastMessage: msgs[0] ?? null,
            };
          } catch {
            return { project, lastMessage: null };
          }
        });

        const convos = await Promise.all(conversationPromises);

        // Sort: most recent message first, no-message projects last
        convos.sort((a, b) => {
          if (!a.lastMessage && !b.lastMessage) return 0;
          if (!a.lastMessage) return 1;
          if (!b.lastMessage) return -1;
          return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
        });

        setConversations(convos);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Auto-select first project with messages on load
  React.useEffect(() => {
    if (!loading && conversations.length > 0 && !selectedProjectId) {
      const firstWithMessages = conversations.find((c) => c.lastMessage);
      setSelectedProjectId(firstWithMessages?.project.id ?? conversations[0].project.id);
    }
  }, [loading, conversations, selectedProjectId]);

  const filteredConversations = search.trim()
    ? conversations.filter((c) =>
        c.project.name.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  const selectedProject = conversations.find((c) => c.project.id === selectedProjectId);

  function handleSelectProject(projectId: string) {
    setSelectedProjectId(projectId);
    setMobileShowThread(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CcdSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="All conversations across portal projects"
      />

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No messages yet</h3>
            <p className="text-sm text-muted-foreground">
              Start conversations from within portal projects.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex h-[calc(100vh-220px)]">
            {/* Left sidebar - Project list */}
            <div
              className={cn(
                'w-full md:w-80 shrink-0 border-r flex flex-col',
                mobileShowThread && 'hidden md:flex'
              )}
            >
              {/* Search */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 text-sm pl-8"
                  />
                </div>
              </div>

              {/* Conversation list */}
              <ScrollArea className="flex-1">
                <div className="divide-y">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.project.id}
                      onClick={() => handleSelectProject(conv.project.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 transition-colors hover:bg-muted/50',
                        selectedProjectId === conv.project.id && 'bg-muted'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">
                          {conv.project.name}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatRelativeTime(conv.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage ? (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {(conv.lastMessage.sender?.full_name ?? conv.lastMessage.sender_email) && (
                            <span className="font-medium">
                              {conv.lastMessage.sender?.full_name ?? conv.lastMessage.sender_email}:{' '}
                            </span>
                          )}
                          {conv.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 mt-1 italic">
                          No messages yet
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right panel - MessageThread */}
            <div
              className={cn(
                'flex-1 flex flex-col min-w-0',
                !mobileShowThread && 'hidden md:flex'
              )}
            >
              {selectedProject ? (
                <>
                  {/* Thread header */}
                  <div className="px-4 py-3 border-b shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => setMobileShowThread(false)}
                      className="md:hidden text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <h3 className="text-sm font-semibold">
                      {selectedProject.project.name}
                    </h3>
                  </div>
                  {/* Thread content */}
                  <div className="flex-1 overflow-hidden p-4">
                    <MessageThread
                      key={selectedProjectId}
                      projectId={selectedProjectId!}
                      fullHeight
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select a conversation to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
