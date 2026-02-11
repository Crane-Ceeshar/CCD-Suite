'use client';

import { Card, CardContent, Badge } from '@ccd/ui';
import { CalendarDays, Users } from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    color: string | null;
    due_date: string | null;
    task_count?: number;
    completed_task_count?: number;
    members?: { id: string; profile?: { full_name: string; avatar_url: string | null } | null }[];
  };
  onClick?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const total = project.task_count ?? 0;
  const completed = project.completed_task_count ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const memberCount = project.members?.length ?? 0;

  const isOverdue =
    project.due_date && project.status === 'active' && new Date(project.due_date) < new Date();

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
      onClick={onClick}
    >
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: project.color ?? '#6366F1' }}
            />
            <h3 className="font-semibold text-sm truncate">{project.name}</h3>
          </div>
          <Badge className={`shrink-0 text-xs ${STATUS_COLORS[project.status] ?? ''}`}>
            {project.status.replace('_', ' ')}
          </Badge>
        </div>

        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
        )}

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{completed}/{total} tasks</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                backgroundColor: project.color ?? '#6366F1',
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <Badge className={`text-xs ${PRIORITY_COLORS[project.priority] ?? ''}`}>
              {project.priority}
            </Badge>
            {memberCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {memberCount}
              </span>
            )}
          </div>
          {project.due_date && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
              <CalendarDays className="h-3 w-3" />
              {new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
