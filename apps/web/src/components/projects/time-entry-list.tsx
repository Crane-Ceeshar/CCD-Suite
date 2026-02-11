'use client';

import * as React from 'react';
import { Badge, Button, CcdSpinner } from '@ccd/ui';
import { Pencil, Trash2, DollarSign } from 'lucide-react';
import { apiGet, apiDelete } from '@/lib/api';

interface TimeEntryItem {
  id: string;
  task_id: string;
  user_id: string;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  is_running: boolean;
  billable: boolean;
  hourly_rate: number | null;
  task?: { id: string; title: string; project_id: string };
  profile?: { id: string; full_name: string | null; avatar_url: string | null };
}

interface TimeEntryListProps {
  projectId: string;
  refreshKey?: number;
  onEdit?: (entry: TimeEntryItem) => void;
}

function formatDuration(minutes: number | null): string {
  if (minutes == null || minutes === 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function TimeEntryList({ projectId, refreshKey, onEdit }: TimeEntryListProps) {
  const [entries, setEntries] = React.useState<TimeEntryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const loadEntries = React.useCallback(async () => {
    try {
      const res = await apiGet<TimeEntryItem[]>(`/api/projects/${projectId}/time-entries?limit=50`);
      setEntries(res.data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    loadEntries();
  }, [loadEntries, refreshKey]);

  async function handleDelete(entryId: string) {
    setDeleting(entryId);
    try {
      await apiDelete(`/api/projects/${projectId}/time-entries/${entryId}`);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <CcdSpinner size="lg" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No time entries yet. Use the timer above or log time manually.
      </p>
    );
  }

  // Group by date
  const grouped: Record<string, TimeEntryItem[]> = {};
  for (const entry of entries) {
    const dateKey = new Date(entry.started_at).toISOString().slice(0, 10);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(entry);
  }

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => {
        const dayEntries = grouped[date];
        const dayTotal = dayEntries.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);

        return (
          <div key={date}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </h4>
              <span className="text-xs text-muted-foreground font-medium">{formatDuration(dayTotal)}</span>
            </div>
            <div className="space-y-1">
              {dayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{entry.task?.title ?? 'Unknown task'}</p>
                      {entry.billable && (
                        <DollarSign className="h-3 w-3 text-green-500 shrink-0" />
                      )}
                      {entry.is_running && (
                        <Badge className="text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400">Running</Badge>
                      )}
                    </div>
                    {entry.description && (
                      <p className="text-xs text-muted-foreground truncate">{entry.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{entry.profile?.full_name ?? 'Unknown'}</span>
                      <span>
                        {new Date(entry.started_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {entry.ended_at && ` — ${new Date(entry.ended_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-mono font-medium shrink-0">
                    {entry.is_running ? '...' : formatDuration(entry.duration_minutes)}
                  </span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {onEdit && !entry.is_running && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onEdit(entry)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {!entry.is_running && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleting === entry.id}
                      >
                        {deleting === entry.id ? <CcdSpinner size="sm" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
