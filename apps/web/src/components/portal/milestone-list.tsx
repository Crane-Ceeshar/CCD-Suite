'use client';

import * as React from 'react';
import { Badge, Button, CcdSpinner } from '@ccd/ui';
import { CheckCircle, Clock, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { apiPatch, apiDelete } from '@/lib/api';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  completed_at: string | null;
  position: number;
}

interface MilestoneListProps {
  projectId: string;
  milestones: Milestone[];
  onEdit: (milestone: Milestone) => void;
  onRefresh: () => void;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; badge: string }> = {
  upcoming: { icon: Clock, color: 'text-muted-foreground', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  in_progress: { icon: AlertCircle, color: 'text-blue-500', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  completed: { icon: CheckCircle, color: 'text-green-500', badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  overdue: { icon: AlertCircle, color: 'text-red-500', badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export function MilestoneList({ projectId, milestones, onEdit, onRefresh }: MilestoneListProps) {
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [toggling, setToggling] = React.useState<string | null>(null);

  async function handleToggleComplete(milestone: Milestone) {
    setToggling(milestone.id);
    try {
      const newStatus = milestone.status === 'completed' ? 'in_progress' : 'completed';
      await apiPatch(`/api/portal/projects/${projectId}/milestones/${milestone.id}`, { status: newStatus });
      onRefresh();
    } catch {
      // ignore
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete(milestoneId: string) {
    setDeleting(milestoneId);
    try {
      await apiDelete(`/api/portal/projects/${projectId}/milestones/${milestoneId}`);
      onRefresh();
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  }

  if (milestones.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No milestones yet. Add milestones to track project progress.</p>;
  }

  const total = milestones.length;
  const completed = milestones.filter((m) => m.status === 'completed').length;
  const progress = Math.round((completed / total) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{completed}/{total} complete</span>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-cyan-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span>{progress}%</span>
      </div>

      <div className="space-y-2">
        {milestones.map((milestone) => {
          const config = STATUS_CONFIG[milestone.status] ?? STATUS_CONFIG.upcoming;
          const Icon = config.icon;
          const isOverdue = milestone.due_date && milestone.status !== 'completed' && new Date(milestone.due_date) < new Date();

          return (
            <div
              key={milestone.id}
              className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 group"
            >
              <button
                onClick={() => handleToggleComplete(milestone)}
                disabled={toggling === milestone.id}
                className={`shrink-0 ${config.color}`}
              >
                {toggling === milestone.id ? (
                  <CcdSpinner size="sm" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${milestone.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                  {milestone.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={`text-xs ${config.badge}`}>{milestone.status.replace('_', ' ')}</Badge>
                  {milestone.due_date && (
                    <span className={`text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                      {new Date(milestone.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => onEdit(milestone)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(milestone.id)}
                  disabled={deleting === milestone.id}
                >
                  {deleting === milestone.id ? <CcdSpinner size="sm" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
