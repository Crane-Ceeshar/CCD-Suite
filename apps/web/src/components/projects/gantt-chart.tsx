'use client';

import * as React from 'react';
import { Badge } from '@ccd/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GanttTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  assigned_to: string | null;
  assignee_name?: string | null;
  dependencies?: Array<{ depends_on_task_id: string; dependency_type: string }>;
}

export interface GanttChartProps {
  tasks: GanttTask[];
  startDate: Date;
  endDate: Date;
  zoom: 'week' | 'month';
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BAR_COLORS: Record<string, string> = {
  todo: '#94A3B8',
  in_progress: '#6366F1',
  review: '#F59E0B',
  done: '#22C55E',
};

const PRIORITY_DOTS: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-slate-400',
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 48;
const LEFT_PANEL_WIDTH = 200;
const DAY_WIDTH_WEEK = 40; // px per day in week zoom
const DAY_WIDTH_MONTH = 12; // px per day in month zoom

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86_400_000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date, mode: 'short' | 'month'): string {
  if (mode === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function generateColumns(start: Date, end: Date, zoom: 'week' | 'month') {
  const columns: Array<{ date: Date; label: string }> = [];
  const s = startOfDay(start);
  const e = startOfDay(end);

  if (zoom === 'week') {
    // One column per day
    let current = new Date(s);
    while (current <= e) {
      columns.push({
        date: new Date(current),
        label: current.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      });
      current = addDays(current, 1);
    }
  } else {
    // One column per week
    let current = new Date(s);
    // Align to Monday
    const dayOfWeek = current.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    current = addDays(current, diff);
    while (current <= e) {
      columns.push({
        date: new Date(current),
        label: `${current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      });
      current = addDays(current, 7);
    }
  }

  return columns;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function GanttChart({ tasks, startDate, endDate, zoom }: GanttChartProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const chartStart = startOfDay(startDate);
  const chartEnd = startOfDay(endDate);
  const totalDays = daysBetween(chartStart, chartEnd) + 1;
  const dayWidth = zoom === 'week' ? DAY_WIDTH_WEEK : DAY_WIDTH_MONTH;
  const totalWidth = totalDays * dayWidth;

  const columns = React.useMemo(
    () => generateColumns(chartStart, chartEnd, zoom),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chartStart.getTime(), chartEnd.getTime(), zoom],
  );

  // Today marker position
  const today = startOfDay(new Date());
  const todayOffset = daysBetween(chartStart, today);
  const showTodayMarker = todayOffset >= 0 && todayOffset <= totalDays;
  const todayX = todayOffset * dayWidth + dayWidth / 2;

  // Scroll today into view on mount
  React.useEffect(() => {
    if (scrollRef.current && showTodayMarker) {
      const scrollTarget = todayX - scrollRef.current.clientWidth / 2;
      scrollRef.current.scrollLeft = Math.max(0, scrollTarget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  return (
    <div className="flex border rounded-lg overflow-hidden bg-background">
      {/* Left panel — task names */}
      <div
        className="shrink-0 border-r bg-muted/30"
        style={{ width: LEFT_PANEL_WIDTH }}
      >
        {/* Header */}
        <div
          className="flex items-center px-3 border-b font-medium text-xs text-muted-foreground"
          style={{ height: HEADER_HEIGHT }}
        >
          Tasks
        </div>

        {/* Rows */}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2 px-3 border-b hover:bg-muted/50 transition-colors"
            style={{ height: ROW_HEIGHT }}
          >
            <div
              className={`h-2 w-2 rounded-full shrink-0 ${PRIORITY_DOTS[task.priority] ?? 'bg-slate-400'}`}
            />
            <span className="text-xs truncate flex-1" title={task.title}>
              {task.title}
            </span>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 shrink-0"
            >
              {STATUS_LABELS[task.status] ?? task.status}
            </Badge>
          </div>
        ))}

        {tasks.length === 0 && (
          <div
            className="flex items-center justify-center text-xs text-muted-foreground"
            style={{ height: ROW_HEIGHT }}
          >
            No tasks
          </div>
        )}
      </div>

      {/* Right panel — timeline */}
      <div ref={scrollRef} className="flex-1 overflow-x-auto">
        <div style={{ width: totalWidth, minWidth: '100%' }} className="relative">
          {/* Column headers */}
          <div className="flex border-b" style={{ height: HEADER_HEIGHT }}>
            {columns.map((col, i) => {
              const colWidth =
                zoom === 'week'
                  ? dayWidth
                  : i < columns.length - 1
                    ? daysBetween(col.date, columns[i + 1].date) * dayWidth
                    : daysBetween(col.date, chartEnd) * dayWidth + dayWidth;
              return (
                <div
                  key={i}
                  className="shrink-0 flex items-center justify-center border-r text-[10px] text-muted-foreground font-medium"
                  style={{ width: colWidth, height: HEADER_HEIGHT }}
                >
                  {col.label}
                </div>
              );
            })}
          </div>

          {/* Task rows */}
          {tasks.map((task) => {
            const taskStart = task.start_date
              ? startOfDay(new Date(task.start_date))
              : null;
            const taskEnd = task.due_date
              ? startOfDay(new Date(task.due_date))
              : null;

            let barElement: React.ReactNode = null;

            if (taskStart && taskEnd) {
              // Full bar
              const startOffset = daysBetween(chartStart, taskStart);
              const duration = daysBetween(taskStart, taskEnd) + 1;
              const barLeft = startOffset * dayWidth;
              const barWidth = Math.max(duration * dayWidth, 2);
              const barColor = BAR_COLORS[task.status] ?? '#94A3B8';

              barElement = (
                <div
                  className="absolute rounded-sm"
                  style={{
                    left: barLeft,
                    top: 10,
                    width: barWidth,
                    height: ROW_HEIGHT - 20,
                    backgroundColor: barColor,
                    opacity: 0.85,
                  }}
                  title={`${task.title}: ${formatDate(taskStart, 'short')} - ${formatDate(taskEnd, 'short')}`}
                />
              );
            } else if (taskStart || taskEnd) {
              // Diamond marker for single date
              const markerDate = taskStart ?? taskEnd!;
              const offset = daysBetween(chartStart, markerDate);
              const markerX = offset * dayWidth + dayWidth / 2;
              const barColor = BAR_COLORS[task.status] ?? '#94A3B8';

              barElement = (
                <div
                  className="absolute"
                  style={{
                    left: markerX - 6,
                    top: ROW_HEIGHT / 2 - 6,
                    width: 12,
                    height: 12,
                    backgroundColor: barColor,
                    transform: 'rotate(45deg)',
                    borderRadius: 2,
                    opacity: 0.85,
                  }}
                  title={`${task.title}: ${formatDate(markerDate, 'short')}`}
                />
              );
            }

            return (
              <div
                key={task.id}
                className="relative border-b"
                style={{ height: ROW_HEIGHT }}
              >
                {/* Grid lines */}
                {columns.map((col, i) => {
                  const colWidth =
                    zoom === 'week'
                      ? dayWidth
                      : i < columns.length - 1
                        ? daysBetween(col.date, columns[i + 1].date) * dayWidth
                        : daysBetween(col.date, chartEnd) * dayWidth + dayWidth;
                  const colLeft =
                    zoom === 'week'
                      ? i * dayWidth
                      : daysBetween(chartStart, col.date) * dayWidth;
                  const isWeekend =
                    zoom === 'week' &&
                    (col.date.getDay() === 0 || col.date.getDay() === 6);

                  return (
                    <div
                      key={i}
                      className={`absolute top-0 bottom-0 border-r border-border/40 ${
                        isWeekend ? 'bg-muted/20' : ''
                      }`}
                      style={{ left: colLeft, width: colWidth }}
                    />
                  );
                })}
                {barElement}
              </div>
            );
          })}

          {tasks.length === 0 && (
            <div
              className="flex items-center justify-center text-xs text-muted-foreground"
              style={{ height: ROW_HEIGHT }}
            >
              No tasks to display
            </div>
          )}

          {/* Today marker */}
          {showTodayMarker && (
            <div
              className="absolute top-0 bottom-0 border-l-2 border-dashed border-red-500 pointer-events-none z-10"
              style={{ left: todayX }}
            >
              <div className="absolute -top-0 -left-[14px] bg-red-500 text-white text-[9px] px-1 rounded-b font-medium">
                Today
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
