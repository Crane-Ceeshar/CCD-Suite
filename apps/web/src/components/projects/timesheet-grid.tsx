'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, CcdSpinner, Badge } from '@ccd/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface TimesheetRow {
  task_id?: string;
  task_title?: string;
  user_id?: string;
  user_name?: string;
  date?: string;
  entries: Record<string, number>;
  total_minutes: number;
  billable_minutes: number;
  entry_count?: number;
}

interface TimesheetData {
  rows: TimesheetRow[];
  total_minutes: number;
  billable_minutes: number;
  total_cost: number;
}

interface TimesheetGridProps {
  projectId: string;
  refreshKey?: number;
}

function formatMinutes(minutes: number): string {
  if (minutes === 0) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
}

function getWeekDates(date: Date): string[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  const monday = new Date(d.setDate(diff));
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    dates.push(current.toISOString().slice(0, 10));
  }
  return dates;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TimesheetGrid({ projectId, refreshKey }: TimesheetGridProps) {
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [data, setData] = React.useState<TimesheetData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [groupBy, setGroupBy] = React.useState<'task' | 'user'>('task');

  const weekDates = React.useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + weekOffset * 7);
    return getWeekDates(now);
  }, [weekOffset]);

  const from = weekDates[0];
  const to = weekDates[6];

  React.useEffect(() => {
    setLoading(true);
    apiGet<TimesheetData>(`/api/projects/${projectId}/timesheet?from=${from}&to=${to}&group_by=${groupBy}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [projectId, from, to, groupBy, refreshKey]);

  const weekLabel = React.useMemo(() => {
    const start = new Date(from + 'T00:00:00');
    const end = new Date(to + 'T00:00:00');
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [from, to]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Weekly Timesheet</CardTitle>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'task' | 'user')}
          >
            <option value="task">By Task</option>
            <option value="user">By Team Member</option>
          </select>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setWeekOffset((o) => o - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium min-w-[160px] text-center">{weekLabel}</span>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setWeekOffset((o) => o + 1)} disabled={weekOffset >= 0}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {weekOffset !== 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setWeekOffset(0)}>
                This Week
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <CcdSpinner size="lg" />
          </div>
        ) : !data || data.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No time entries for this week.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                      {groupBy === 'task' ? 'Task' : 'Team Member'}
                    </th>
                    {weekDates.map((d, i) => (
                      <th key={d} className="text-center py-2 px-2 font-medium text-muted-foreground min-w-[60px]">
                        <span className="block text-xs">{DAY_LABELS[i]}</span>
                        <span className="block text-[10px] text-muted-foreground/70">{d.slice(8)}</span>
                      </th>
                    ))}
                    <th className="text-right py-2 pl-4 font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 pr-4 font-medium truncate max-w-[180px]">
                        {row.task_title ?? row.user_name ?? 'Unknown'}
                      </td>
                      {weekDates.map((d) => {
                        const mins = row.entries[d] ?? 0;
                        return (
                          <td key={d} className="text-center py-2 px-2">
                            <span className={mins > 0 ? 'font-mono text-xs' : 'text-muted-foreground/40 text-xs'}>
                              {formatMinutes(mins)}
                            </span>
                          </td>
                        );
                      })}
                      <td className="text-right py-2 pl-4 font-medium font-mono text-xs">
                        {formatMinutes(row.total_minutes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2">
                    <td className="py-2 pr-4 font-bold">Total</td>
                    {weekDates.map((d) => {
                      const dayTotal = data.rows.reduce((sum, row) => sum + (row.entries[d] ?? 0), 0);
                      return (
                        <td key={d} className="text-center py-2 px-2 font-bold font-mono text-xs">
                          {formatMinutes(dayTotal)}
                        </td>
                      );
                    })}
                    <td className="text-right py-2 pl-4 font-bold font-mono text-xs">
                      {formatMinutes(data.total_minutes)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
              <span>Total: <strong>{formatMinutes(data.total_minutes)}</strong></span>
              <span>Billable: <strong>{formatMinutes(data.billable_minutes)}</strong></span>
              {data.total_cost > 0 && (
                <span>Cost: <strong>${data.total_cost.toLocaleString()}</strong></span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
