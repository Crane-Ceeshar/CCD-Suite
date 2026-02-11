'use client';

import * as React from 'react';
import { DataTable, StatusBadge, Badge, type Column } from '@ccd/ui';
import { formatDate } from '@ccd/shared';
import { apiGet } from '@/lib/api';

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  project_id: string;
  due_date: string | null;
  assigned_to: string | null;
  estimated_hours: number | null;
  labels: string[];
  created_at: string;
  assignee?: { id: string; full_name: string } | null;
  [key: string]: unknown;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const columns: Column<TaskRow>[] = [
  { key: 'title', header: 'Task', sortable: true },
  { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
  {
    key: 'priority',
    header: 'Priority',
    render: (t) => (
      <Badge className={`text-xs ${PRIORITY_COLORS[t.priority] ?? ''}`}>
        {t.priority}
      </Badge>
    ),
  },
  {
    key: 'assigned_to',
    header: 'Assignee',
    render: (t) => t.assignee?.full_name ?? '-',
  },
  {
    key: 'due_date',
    header: 'Due Date',
    sortable: true,
    render: (t) => {
      if (!t.due_date) return '-';
      const isOverdue = t.status !== 'done' && new Date(t.due_date) < new Date();
      return (
        <span className={isOverdue ? 'text-destructive font-medium' : ''}>
          {formatDate(t.due_date)}
        </span>
      );
    },
  },
  {
    key: 'estimated_hours',
    header: 'Est. Hours',
    render: (t) => t.estimated_hours != null ? `${t.estimated_hours}h` : '-',
  },
  {
    key: 'labels',
    header: 'Labels',
    render: (t) => (
      <div className="flex gap-1 flex-wrap">
        {(t.labels ?? []).slice(0, 3).map((label) => (
          <Badge key={label} variant="outline" className="text-xs">
            {label}
          </Badge>
        ))}
      </div>
    ),
  },
  { key: 'created_at', header: 'Created', sortable: true, render: (t) => formatDate(t.created_at) },
];

interface TaskListProps {
  projectId: string | null;
  onTaskClick?: (task: TaskRow) => void;
  refreshKey?: number;
}

export function TaskList({ projectId, onTaskClick, refreshKey }: TaskListProps) {
  const [tasks, setTasks] = React.useState<TaskRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiGet<TaskRow[]>(`/api/projects/${projectId}/tasks?limit=500&sort=created_at&dir=desc`)
      .then((res) => setTasks(res.data))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [projectId, refreshKey]);

  return (
    <DataTable
      columns={columns}
      data={tasks}
      keyExtractor={(t) => t.id}
      emptyMessage={projectId ? 'No tasks found. Create your first task to get started.' : 'Select a project to view tasks.'}
      loading={loading}
      onRowClick={onTaskClick}
    />
  );
}
