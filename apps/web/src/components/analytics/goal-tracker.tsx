'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  toast,
} from '@ccd/ui';
import { Target, Trash2, Pause, Play } from 'lucide-react';
import { apiPatch, apiDelete } from '@/lib/api';

interface Goal {
  id: string;
  name: string;
  description: string | null;
  metric_key: string;
  target_value: number;
  current_value: number;
  unit: string;
  period: string;
  status: 'active' | 'completed' | 'missed' | 'paused';
  start_date: string;
  end_date: string | null;
}

interface GoalTrackerProps {
  goals: Goal[];
  onRefresh: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  missed: 'bg-red-100 text-red-700',
  paused: 'bg-gray-100 text-gray-600',
};

const formatValue = (v: number, unit: string) => {
  if (unit === '$' || unit === 'currency') {
    return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toLocaleString()}`;
  }
  if (unit === '%') return `${v}%`;
  return v.toLocaleString();
};

export function GoalTracker({ goals, onRefresh }: GoalTrackerProps) {
  async function togglePause(goal: Goal) {
    try {
      const newStatus = goal.status === 'paused' ? 'active' : 'paused';
      await apiPatch(`/api/analytics/goals/${goal.id}`, { status: newStatus });
      onRefresh();
    } catch {
      toast({ title: 'Error', description: 'Failed to update goal', variant: 'destructive' });
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/analytics/goals/${id}`);
      toast({ title: 'Deleted', description: 'Goal removed' });
      onRefresh();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete goal', variant: 'destructive' });
    }
  }

  if (goals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {goals.map((goal) => {
        const progress = goal.target_value > 0
          ? Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100)
          : 0;
        const isOver = goal.current_value >= goal.target_value;

        return (
          <Card key={goal.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{goal.name}</p>
                    {goal.description && (
                      <p className="text-xs text-muted-foreground">{goal.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className={`text-xs ${STATUS_COLORS[goal.status]}`}>
                    {goal.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => togglePause(goal)}
                    title={goal.status === 'paused' ? 'Resume' : 'Pause'}
                  >
                    {goal.status === 'paused' ? (
                      <Play className="h-3 w-3" />
                    ) : (
                      <Pause className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={() => handleDelete(goal.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {formatValue(goal.current_value, goal.unit)} / {formatValue(goal.target_value, goal.unit)}
                  </span>
                  <span className={`font-medium ${isOver ? 'text-green-600' : ''}`}>
                    {progress}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-green-500' : progress >= 75 ? 'bg-blue-500' : progress >= 50 ? 'bg-amber-500' : 'bg-red-400'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
