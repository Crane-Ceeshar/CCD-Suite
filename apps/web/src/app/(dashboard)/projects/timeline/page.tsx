'use client';

import * as React from 'react';
import {
  PageHeader,
  Button,
  CcdSpinner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ccd/ui';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, CalendarRange } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { GanttChart, type GanttTask } from '@/components/projects/gantt-chart';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProjectOption {
  id: string;
  name: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TimelinePage() {
  const [projects, setProjects] = React.useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<string>('');
  const [tasks, setTasks] = React.useState<GanttTask[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [projectsLoading, setProjectsLoading] = React.useState(true);

  const [zoom, setZoom] = React.useState<'week' | 'month'>('week');

  // Date range: default to 4 weeks centered on today
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const [rangeStart, setRangeStart] = React.useState<Date>(() => addDays(today, -14));
  const [rangeEnd, setRangeEnd] = React.useState<Date>(() => addDays(today, 14));

  // Load projects
  React.useEffect(() => {
    setProjectsLoading(true);
    apiGet<ProjectOption[]>('/api/projects?limit=100')
      .then((res) => setProjects(res.data))
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
  }, []);

  // Load tasks when project changes
  React.useEffect(() => {
    if (!selectedProject) {
      setTasks([]);
      return;
    }

    setLoading(true);
    apiGet<GanttTask[]>(`/api/projects/${selectedProject}/tasks?limit=500`)
      .then((res) => setTasks(res.data))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [selectedProject]);

  // Navigate date range
  const shiftDays = zoom === 'week' ? 7 : 30;

  function handlePrev() {
    setRangeStart((s) => addDays(s, -shiftDays));
    setRangeEnd((e) => addDays(e, -shiftDays));
  }

  function handleNext() {
    setRangeStart((s) => addDays(s, shiftDays));
    setRangeEnd((e) => addDays(e, shiftDays));
  }

  function handleToday() {
    setRangeStart(addDays(today, -14));
    setRangeEnd(addDays(today, 14));
  }

  function toggleZoom() {
    if (zoom === 'week') {
      // Switch to month: expand range to 3 months
      setZoom('month');
      setRangeStart(addDays(today, -45));
      setRangeEnd(addDays(today, 45));
    } else {
      // Switch to week: contract range to 4 weeks
      setZoom('week');
      setRangeStart(addDays(today, -14));
      setRangeEnd(addDays(today, 14));
    }
  }

  const dateRangeLabel = `${rangeStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${rangeEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timeline"
        description="Gantt-style project timeline view"
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: 'Timeline' },
        ]}
        actions={
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select project..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">{dateRangeLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleZoom}
            title={zoom === 'week' ? 'Switch to month view' : 'Switch to week view'}
          >
            {zoom === 'week' ? (
              <>
                <ZoomOut className="h-4 w-4 mr-1" />
                Month
              </>
            ) : (
              <>
                <ZoomIn className="h-4 w-4 mr-1" />
                Week
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      {projectsLoading ? (
        <div className="flex items-center justify-center py-20">
          <CcdSpinner size="lg" />
        </div>
      ) : !selectedProject ? (
        <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
          <CalendarRange className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            Select a project to view its timeline
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
            Choose a project from the dropdown above to see tasks displayed on a Gantt chart.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <CcdSpinner size="lg" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
          <CalendarRange className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm font-medium text-muted-foreground">No tasks found</p>
          <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
            This project has no tasks yet. Add tasks with start and due dates to see them on the timeline.
          </p>
        </div>
      ) : (
        <GanttChart
          tasks={tasks}
          startDate={rangeStart}
          endDate={rangeEnd}
          zoom={zoom}
        />
      )}
    </div>
  );
}
