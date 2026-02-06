'use client';

import * as React from 'react';
import { DataTable, StatusBadge, Badge, type Column } from '@ccd/ui';
import { formatDate } from '@ccd/shared';

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  project_id: string;
  due_date: string | null;
  assigned_to: string | null;
  created_at: string;
  [key: string]: unknown;
}

const columns: Column<TaskRow>[] = [
  { key: 'title', header: 'Task', sortable: true },
  { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
  {
    key: 'priority', header: 'Priority',
    render: (t) => (
      <Badge variant={t.priority === 'high' || t.priority === 'urgent' ? 'destructive' : 'outline'}>
        {t.priority}
      </Badge>
    ),
  },
  { key: 'due_date', header: 'Due Date', sortable: true, render: (t) => t.due_date ? formatDate(t.due_date) : '-' },
  { key: 'created_at', header: 'Created', sortable: true, render: (t) => formatDate(t.created_at) },
];

export function TaskList() {
  const [tasks, setTasks] = React.useState<TaskRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setTasks([]);
    setLoading(false);
  }, []);

  return (
    <DataTable
      columns={columns}
      data={tasks}
      keyExtractor={(t) => t.id}
      emptyMessage="No tasks found. Create your first task to get started."
      loading={loading}
    />
  );
}
