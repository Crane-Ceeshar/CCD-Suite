'use client';

import * as React from 'react';
import { Button, Badge, CcdSpinner } from '@ccd/ui';
import { Play, Square, Clock } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

interface RunningTimer {
  id: string;
  task_id: string;
  started_at: string;
  task?: { id: string; title: string; project_id: string };
}

interface Task {
  id: string;
  title: string;
  status: string;
}

interface TimerWidgetProps {
  projectId: string;
  onTimerChange?: () => void;
}

export function TimerWidget({ projectId, onTimerChange }: TimerWidgetProps) {
  const [running, setRunning] = React.useState<RunningTimer | null>(null);
  const [elapsed, setElapsed] = React.useState('00:00:00');
  const [loading, setLoading] = React.useState(true);
  const [starting, setStarting] = React.useState(false);
  const [stopping, setStopping] = React.useState(false);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = React.useState('');

  // Load running timer
  const loadTimer = React.useCallback(async () => {
    try {
      const res = await apiGet<RunningTimer | null>(`/api/projects/${projectId}/time-entries/running`);
      setRunning(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load tasks
  React.useEffect(() => {
    apiGet<Task[]>(`/api/projects/${projectId}/tasks?status=todo,in_progress,review&limit=200`)
      .then((res) => {
        const data = res.data ?? [];
        setTasks(data);
        if (data.length > 0 && !selectedTaskId) {
          setSelectedTaskId(data[0].id);
        }
      })
      .catch(() => {});
  }, [projectId]);

  React.useEffect(() => {
    loadTimer();
  }, [loadTimer]);

  // Elapsed time ticker
  React.useEffect(() => {
    if (!running) {
      setElapsed('00:00:00');
      return;
    }

    function tick() {
      if (!running) return;
      const start = new Date(running.started_at).getTime();
      const now = Date.now();
      const diffSec = Math.floor((now - start) / 1000);
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;
      setElapsed(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [running]);

  async function handleStart() {
    if (!selectedTaskId) return;
    setStarting(true);
    try {
      await apiPost(`/api/projects/${projectId}/time-entries`, {
        task_id: selectedTaskId,
        started_at: new Date().toISOString(),
        is_running: true,
      });
      await loadTimer();
      onTimerChange?.();
    } catch {
      // ignore
    } finally {
      setStarting(false);
    }
  }

  async function handleStop() {
    if (!running) return;
    setStopping(true);
    try {
      await apiPatch(`/api/projects/${projectId}/time-entries/${running.id}`, {
        is_running: false,
        ended_at: new Date().toISOString(),
      });
      setRunning(null);
      onTimerChange?.();
    } catch {
      // ignore
    } finally {
      setStopping(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
        <CcdSpinner size="sm" />
        <span className="text-sm text-muted-foreground">Loading timer...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <Clock className="h-5 w-5 text-muted-foreground shrink-0" />

      {running ? (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{running.task?.title ?? 'Running...'}</p>
            <p className="text-2xl font-mono font-bold text-cyan-600 dark:text-cyan-400">{elapsed}</p>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleStop}
            disabled={stopping}
          >
            {stopping ? <CcdSpinner size="sm" className="mr-1" /> : <Square className="mr-1 h-3.5 w-3.5" />}
            Stop
          </Button>
        </>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <select
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
            >
              {tasks.length === 0 && <option value="">No tasks available</option>}
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          <Button
            size="sm"
            onClick={handleStart}
            disabled={starting || !selectedTaskId}
          >
            {starting ? <CcdSpinner size="sm" className="mr-1" /> : <Play className="mr-1 h-3.5 w-3.5" />}
            Start
          </Button>
        </>
      )}
    </div>
  );
}
