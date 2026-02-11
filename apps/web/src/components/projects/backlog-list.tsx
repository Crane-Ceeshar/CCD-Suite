'use client';

import * as React from 'react';
import { Badge, Button, CcdSpinner } from '@ccd/ui';
import { GripVertical, ArrowRight } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  story_points: number | null;
  assignee?: { id: string; full_name: string | null } | null;
}

interface Sprint {
  id: string;
  name: string;
  status: string;
}

interface BacklogListProps {
  projectId: string;
  sprints: Sprint[];
  refreshKey?: number;
  onRefresh?: () => void;
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export function BacklogList({ projectId, sprints, refreshKey, onRefresh }: BacklogListProps) {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [assigning, setAssigning] = React.useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    setLoading(true);
    apiGet<Task[]>(`/api/projects/${projectId}/backlog`)
      .then((res) => setTasks(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId, refreshKey]);

  async function assignToSprint(taskIds: string[], sprintId: string) {
    setAssigning(sprintId);
    try {
      await apiPatch(`/api/projects/${projectId}/backlog`, {
        task_ids: taskIds,
        sprint_id: sprintId,
      });
      setTasks((prev) => prev.filter((t) => !taskIds.includes(t.id)));
      setSelectedTasks(new Set());
      onRefresh?.();
    } catch {
      // ignore
    } finally {
      setAssigning(null);
    }
  }

  function toggleTask(taskId: string) {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  const activeSprints = sprints.filter((s) => s.status === 'planning' || s.status === 'active');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <CcdSpinner size="lg" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No backlog items. All tasks are assigned to sprints.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk assign */}
      {selectedTasks.size > 0 && activeSprints.length > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
          <span className="text-xs font-medium">{selectedTasks.size} selected</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          {activeSprints.map((sprint) => (
            <Button
              key={sprint.id}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => assignToSprint([...selectedTasks], sprint.id)}
              disabled={!!assigning}
            >
              {assigning === sprint.id ? <CcdSpinner size="sm" className="mr-1" /> : null}
              {sprint.name}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setSelectedTasks(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-1">
        {tasks.map((task) => {
          const priorityClass = PRIORITY_COLOR[task.priority] ?? PRIORITY_COLOR.medium;
          return (
            <div
              key={task.id}
              className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50"
            >
              <input
                type="checkbox"
                className="rounded"
                checked={selectedTasks.has(task.id)}
                onChange={() => toggleTask(task.id)}
              />
              <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
              </div>
              <Badge className={`text-xs ${priorityClass}`}>{task.priority}</Badge>
              {task.story_points != null && (
                <span className="text-xs font-mono bg-muted rounded-full px-1.5 py-0.5">
                  {task.story_points}pt
                </span>
              )}
              {task.assignee?.full_name && (
                <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                  {task.assignee.full_name}
                </span>
              )}
              {/* Quick assign to sprint */}
              {activeSprints.length > 0 && (
                <select
                  className="rounded border border-input bg-background px-1 py-0.5 text-xs w-24"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      assignToSprint([task.id], e.target.value);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">Move to...</option>
                  {activeSprints.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
