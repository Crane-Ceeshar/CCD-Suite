'use client';

import * as React from 'react';
import {
  PageHeader,
  StatCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  StatusBadge,
  Badge,
  CcdLoader,
} from '@ccd/ui';
import { PenTool, FileText, Calendar, Eye, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { formatDate } from '@ccd/shared';
import { AskAiButton } from '@/components/ai/ask-ai-button';

const MODULE_COLOR = '#EC4899';

interface ContentStats {
  total: number;
  published: number;
  scheduled: number;
  in_review: number;
  drafts: number;
  archived: number;
  by_type: Record<string, number>;
  by_category: Record<string, number>;
  recent: Array<{
    id: string;
    title: string;
    status: string;
    content_type: string;
    created_at: string;
    category: { id: string; name: string; color: string } | null;
  }>;
}

export default function ContentDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = React.useState<ContentStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiGet<ContentStats>('/api/content/stats');
        setStats(res.data);
      } catch {
        /* handled */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content"
        description="Content planning, creation, and scheduling"
        actions={
          <Button onClick={() => router.push('/content/editor')}>
            <Plus className="mr-2 h-4 w-4" />
            New Content
          </Button>
        }
      />

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Items"
          value={String(stats?.total ?? 0)}
          change={`${stats?.drafts ?? 0} drafts`}
          trend={stats?.total ? 'up' : 'neutral'}
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Published"
          value={String(stats?.published ?? 0)}
          trend={stats?.published ? 'up' : 'neutral'}
          icon={<PenTool className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Scheduled"
          value={String(stats?.scheduled ?? 0)}
          trend="neutral"
          icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="In Review"
          value={String(stats?.in_review ?? 0)}
          trend="neutral"
          icon={<Eye className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
      </div>

      {/* ── Recent Content ─────────────────────────────────── */}
      {stats?.recent && stats.recent.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Content</CardTitle>
            <Link href="/content/library">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent.map((item) => (
                <Link
                  key={item.id}
                  href={`/content/editor?id=${item.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="capitalize text-xs">
                          {item.content_type.replace(/_/g, ' ')}
                        </Badge>
                        {item.category && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: item.category.color ?? '#94a3b8' }}
                            />
                            {item.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={item.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Quick Links ────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/content/calendar">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Editorial Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Plan and schedule content across channels
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/content/library">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Content Library</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Browse and manage all content pieces
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/content/editor">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Content Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and edit content with the rich editor
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <AskAiButton moduleContext="content" />
    </div>
  );
}
