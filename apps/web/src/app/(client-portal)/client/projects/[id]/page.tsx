'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Download,
  Send,
  MessageSquare,
} from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  completed_at: string | null;
  position: number;
}

interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  status: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  feedback: string | null;
  created_at: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string | null;
  sender_email: string | null;
  created_at: string;
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  milestones: Milestone[];
  deliverables: Deliverable[];
  messages: Message[];
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  active: { label: 'Active', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  completed: { label: 'Completed', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  on_hold: { label: 'On Hold', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

const MILESTONE_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  in_progress: <Clock className="h-4 w-4 text-blue-500" />,
  upcoming: <Circle className="h-4 w-4 text-muted-foreground" />,
};

const DELIVERABLE_STATUS: Record<string, { label: string; class: string }> = {
  pending_review: { label: 'Pending Review', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved: { label: 'Approved', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  revision_requested: { label: 'Revision Requested', class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  delivered: { label: 'Delivered', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClientProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = React.useState<ProjectDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // Messages state
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    fetch(`/api/client/projects/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Failed to load project');
        setProject(json.data);
        setMessages(json.data.messages ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/client/projects/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setMessages((prev) => [...prev, json.data]);
        setNewMessage('');
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-destructive">{error || 'Project not found'}</p>
        <Link href="/client/dashboard" className="mt-2 text-sm text-primary underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/client/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to projects
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${statusConfig.class}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Project Progress</p>
          <p className="text-sm font-bold">{project.progress}%</p>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          {project.start_date && project.end_date && (
            <span>
              {new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' — '}
              {new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Milestones */}
          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h2 className="text-base font-semibold">Milestones</h2>
            </div>
            <div className="p-4">
              {project.milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No milestones yet.</p>
              ) : (
                <div className="space-y-3">
                  {project.milestones.map((m) => (
                    <div key={m.id} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {MILESTONE_ICON[m.status] ?? MILESTONE_ICON.upcoming}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${m.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                          {m.title}
                        </p>
                        {m.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                        )}
                        {m.due_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Due: {new Date(m.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Deliverables */}
          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h2 className="text-base font-semibold">Deliverables</h2>
            </div>
            <div className="p-4">
              {project.deliverables.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No deliverables yet.</p>
              ) : (
                <div className="space-y-2">
                  {project.deliverables.map((d) => {
                    const dConfig = DELIVERABLE_STATUS[d.status] ?? DELIVERABLE_STATUS.pending_review;
                    return (
                      <div key={d.id} className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{d.title}</p>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${dConfig.class}`}>
                              {dConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {d.file_name && <span>{d.file_name}</span>}
                            {d.file_size && <span>{formatFileSize(d.file_size)}</span>}
                          </div>
                          {d.feedback && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{d.feedback}</p>
                          )}
                        </div>
                        {d.file_url && (
                          <a
                            href={d.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 p-1.5 rounded hover:bg-muted"
                            title="Download"
                          >
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </h2>
            </div>
            <div className="p-4">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No messages yet. Start the conversation below.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                  {messages.map((m) => (
                    <div key={m.id} className={`text-sm ${m.sender_id ? '' : 'ml-8'}`}>
                      <div className={`rounded-lg p-3 ${m.sender_id ? 'bg-muted' : 'bg-primary/10'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {m.sender_id ? 'Team' : (m.sender_email ?? 'You')}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(m.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Compose */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="inline-flex items-center justify-center h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold">Project Info</h3>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.class}`}>
                {statusConfig.label}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
                </div>
                <span className="text-sm font-medium">{project.progress}%</span>
              </div>
            </div>
            {(project.start_date || project.end_date) && (
              <div>
                <p className="text-xs text-muted-foreground">Timeline</p>
                <p className="text-sm">
                  {project.start_date && project.end_date
                    ? `${new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : project.start_date ? `Starts ${new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : `Due ${new Date(project.end_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </p>
              </div>
            )}
            {project.budget != null && (
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="text-sm font-medium">${project.budget.toLocaleString()}</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h3 className="text-sm font-semibold">Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Milestones</span>
              <span className="font-medium">{project.milestones.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-medium">
                {project.milestones.filter((m) => m.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Deliverables</span>
              <span className="font-medium">{project.deliverables.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Messages</span>
              <span className="font-medium">{messages.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
