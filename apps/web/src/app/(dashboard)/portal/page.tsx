'use client';

import * as React from 'react';
import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle, Badge, CcdSpinner } from '@ccd/ui';
import { FolderOpen, FileCheck, MessageSquare, Bell } from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

interface DashboardProject {
  id: string;
  name: string;
  status: string;
  progress: number;
  milestone_count: number;
  deliverable_count: number;
  message_count: number;
  pending_deliverables: number;
  last_activity: string | null;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

interface DashboardData {
  projects: DashboardProject[];
  notifications: Notification[];
  stats: {
    total_projects: number;
    active_projects: number;
    pending_deliverables: number;
  };
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  active: { label: 'Active', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  completed: { label: 'Completed', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  on_hold: { label: 'On Hold', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

export default function PortalDashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiGet<DashboardData>('/api/portal/dashboard')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CcdSpinner size="lg" />
      </div>
    );
  }

  const stats = data?.stats ?? { total_projects: 0, active_projects: 0, pending_deliverables: 0 };
  const projects = data?.projects ?? [];
  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Portal"
        description="External client collaboration and communication"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Projects"
          value={String(stats.total_projects)}
          trend="neutral"
          icon={<FolderOpen className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#06B6D4"
        />
        <StatCard
          label="Active Projects"
          value={String(stats.active_projects)}
          trend="neutral"
          icon={<FolderOpen className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#06B6D4"
        />
        <StatCard
          label="Pending Deliverables"
          value={String(stats.pending_deliverables)}
          change="Awaiting review"
          trend="neutral"
          icon={<FileCheck className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#06B6D4"
        />
        <StatCard
          label="Notifications"
          value={String(unreadCount)}
          change={unreadCount > 0 ? 'Unread' : 'All caught up'}
          trend="neutral"
          icon={<Bell className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#06B6D4"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No portal projects yet.</p>
                  <Link href="/portal/projects/new" className="text-sm text-primary mt-1 inline-block">
                    Create your first project
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((p) => {
                    const config = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.active;
                    return (
                      <Link key={p.id} href={`/portal/projects/${p.id}`}>
                        <div className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{p.name}</p>
                              <Badge className={`text-xs ${config.class}`}>{config.label}</Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{p.milestone_count} milestones</span>
                              <span>{p.deliverable_count} deliverables</span>
                              <span>{p.message_count} messages</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {p.pending_deliverables > 0 && (
                              <Badge className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                {p.pending_deliverables} pending
                              </Badge>
                            )}
                            <div className="w-16">
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${p.progress}%` }} />
                              </div>
                              <p className="text-[10px] text-muted-foreground text-right mt-0.5">{p.progress}%</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent notifications */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 8).map((n) => (
                    <div key={n.id} className={`text-sm ${n.is_read ? 'opacity-60' : ''}`}>
                      <p className="font-medium text-xs">{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground truncate">{n.body}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(n.created_at).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
