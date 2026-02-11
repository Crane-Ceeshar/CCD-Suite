'use client';

import * as React from 'react';
import { PageHeader, Card, CardContent, Badge, CcdSpinner } from '@ccd/ui';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

interface PortalProject {
  id: string;
  name: string;
}

interface Message {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  portal_project_id: string;
  sender?: { id: string; full_name: string | null; email: string | null } | null;
}

export default function MessagesPage() {
  const [projects, setProjects] = React.useState<PortalProject[]>([]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterProjectId, setFilterProjectId] = React.useState('');

  React.useEffect(() => {
    async function load() {
      try {
        const projectsRes = await apiGet<PortalProject[]>('/api/portal/projects?limit=100');
        const projectList = projectsRes.data ?? [];
        setProjects(projectList);

        const allMessages: Message[] = [];
        for (const p of projectList) {
          try {
            const res = await apiGet<Message[]>(`/api/portal/projects/${p.id}/messages?limit=50`);
            const items = (res.data ?? []).map((m) => ({ ...m, portal_project_id: p.id }));
            allMessages.push(...items);
          } catch {
            // ignore
          }
        }
        allMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setMessages(allMessages);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const filteredMessages = filterProjectId
    ? messages.filter((m) => m.portal_project_id === filterProjectId)
    : messages;

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
      >
        {projects.length > 0 && (
          <select
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </PageHeader>

      {filteredMessages.length === 0 ? (
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
        <div className="space-y-2">
          {filteredMessages.map((msg) => (
            <Link key={msg.id} href={`/portal/projects/${msg.portal_project_id}`}>
              <div className="flex items-start gap-3 py-3 px-4 rounded-lg border hover:bg-muted/30">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                  {(msg.sender?.full_name ?? 'U').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{msg.sender?.full_name ?? 'Unknown'}</span>
                    {msg.is_internal && (
                      <Badge variant="outline" className="text-xs">Internal</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      in {projectMap.get(msg.portal_project_id) ?? 'Unknown project'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{msg.content}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(msg.created_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
