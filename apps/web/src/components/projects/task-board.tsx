'use client';

import * as React from 'react';
import { Card, CardContent, Badge, LoadingSpinner, UserAvatar } from '@ccd/ui';
import { GripVertical } from 'lucide-react';

const TASK_COLUMNS = [
  { status: 'todo', label: 'To Do', color: '#94a3b8' },
  { status: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { status: 'review', label: 'Review', color: '#8b5cf6' },
  { status: 'done', label: 'Done', color: '#22c55e' },
];

interface TaskCard {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigned_to: string | null;
}

export function TaskBoard() {
  const [tasks, setTasks] = React.useState<TaskCard[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setTasks([]);
    setLoading(false);
  }, []);

  if (loading) return <LoadingSpinner size="lg" label="Loading tasks..." />;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {TASK_COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div key={col.status} className="flex w-72 flex-shrink-0 flex-col">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: col.color }} />
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <Badge variant="secondary" className="ml-auto">{columnTasks.length}</Badge>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-lg bg-muted/50 p-2 min-h-[200px]">
              {columnTasks.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No tasks</p>
              ) : (
                columnTasks.map((task) => (
                  <Card key={task.id} className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant={task.priority === 'high' || task.priority === 'urgent' ? 'destructive' : 'outline'} className="text-xs">
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
