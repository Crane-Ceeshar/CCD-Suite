'use client';

import * as React from 'react';
import { PageHeader, Card, CardContent, Badge, Button, Input, toast } from '@ccd/ui';
import { Calendar, Save, Loader2, Clock } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────

interface ScheduledItem {
  id: string;
  title: string;
  content_type: string;
  status: string;
  publish_date: string;
  slug: string | null;
  created_at: string;
}

interface QueueResponse {
  items: ScheduledItem[];
  total: number;
  page: number;
  limit: number;
}

// ── Helpers ─────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  article: '#3B82F6',
  blog_post: '#8B5CF6',
  social_post: '#F59E0B',
  email: '#EC4899',
  landing_page: '#10B981',
  ad_copy: '#EF4444',
  video_script: '#6366F1',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Page ───────────────────────────────────────────────────────────

export default function SchedulingQueuePage() {
  const [items, setItems] = React.useState<ScheduledItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editedDates, setEditedDates] = React.useState<Map<string, string>>(new Map());
  const limit = 50;

  const fetchQueue = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<QueueResponse>(
        `/api/content/scheduling-queue?page=${page}&limit=${limit}`
      );
      setItems(res.data.items);
      setTotal(res.data.total);
      setEditedDates(new Map());
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load queue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [page]);

  React.useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  function handleDateChange(id: string, newDate: string) {
    setEditedDates((prev) => {
      const next = new Map(prev);
      next.set(id, newDate);
      return next;
    });
  }

  async function handleSave() {
    if (editedDates.size === 0) return;

    try {
      setSaving(true);
      const reorderItems = Array.from(editedDates.entries()).map(([id, publish_date]) => ({
        id,
        publish_date,
      }));

      await apiPatch('/api/content/scheduling-queue', { items: reorderItems });

      toast({ title: 'Saved', description: `Updated ${reorderItems.length} item(s).` });
      await fetchQueue();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = editedDates.size > 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduling Queue"
        description="Manage and reorder your scheduled content"
        actions={
          <Button size="sm" disabled={!hasChanges || saving} onClick={handleSave}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
            {hasChanges && (
              <Badge variant="secondary" className="ml-2 text-[10px]">
                {editedDates.size}
              </Badge>
            )}
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Calendar className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">No scheduled content</p>
          <p className="text-xs mt-1">Schedule content from the editor to see it here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const typeColor = TYPE_COLORS[item.content_type] ?? '#6B7280';
            const editedDate = editedDates.get(item.id);
            const currentDate = editedDate ?? item.publish_date;

            return (
              <Card key={item.id} className={editedDate ? 'ring-1 ring-primary/50' : ''}>
                <CardContent className="p-4 flex items-center gap-4">
                  {/* Type indicator */}
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: typeColor }}
                    title={item.content_type.replace(/_/g, ' ')}
                  />

                  {/* Content info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px]">
                        {item.content_type.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.publish_date)}
                      </span>
                    </div>
                  </div>

                  {/* Date editor */}
                  <div className="shrink-0 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="datetime-local"
                      value={currentDate.slice(0, 16)}
                      onChange={(e) => handleDateChange(item.id, new Date(e.target.value).toISOString())}
                      className="h-8 text-xs w-52"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
