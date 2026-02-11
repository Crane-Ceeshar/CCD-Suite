'use client';

import * as React from 'react';
import { Card, CardContent, Badge, LoadingSpinner } from '@ccd/ui';
import { GripVertical, CalendarDays } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { apiGet, apiPost } from '@/lib/api';

const TASK_COLUMNS = [
  { status: 'todo', label: 'To Do', color: '#94a3b8' },
  { status: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { status: 'review', label: 'Review', color: '#8b5cf6' },
  { status: 'done', label: 'Done', color: '#22c55e' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

interface TaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  due_date: string | null;
  labels: string[];
  position: number;
  subtask_count?: number;
  assignee?: { id: string; full_name: string; avatar_url: string | null } | null;
}

interface TaskBoardProps {
  projectId: string | null;
  onTaskClick?: (task: TaskItem) => void;
  onQuickAdd?: (status: string) => void;
  refreshKey?: number;
}

// ── Sortable task card ──

function SortableTaskCard({ task, onClick }: { task: TaskItem; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const isOverdue =
    task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{task.title}</p>
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <Badge className={`text-xs ${PRIORITY_COLORS[task.priority] ?? ''}`}>
                {task.priority}
              </Badge>
              {task.labels?.slice(0, 2).map((label) => (
                <Badge key={label} variant="outline" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {task.assignee && (
                  <span className="flex items-center gap-1">
                    <span className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-medium">
                      {task.assignee.full_name.charAt(0)}
                    </span>
                    <span className="truncate max-w-[80px]">{task.assignee.full_name.split(' ')[0]}</span>
                  </span>
                )}
                {(task.subtask_count ?? 0) > 0 && (
                  <span>{task.subtask_count} subtask{task.subtask_count === 1 ? '' : 's'}</span>
                )}
              </div>
              {task.due_date && (
                <span className={`flex items-center gap-0.5 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                  <CalendarDays className="h-3 w-3" />
                  {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Droppable column ──

function DroppableColumn({
  status,
  label,
  color,
  tasks,
  onTaskClick,
  onQuickAdd,
}: {
  status: string;
  label: string;
  color: string;
  tasks: TaskItem[];
  onTaskClick?: (task: TaskItem) => void;
  onQuickAdd?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-72 flex-shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-semibold">{label}</h3>
        <Badge variant="secondary" className="ml-auto">{tasks.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 rounded-lg p-2 min-h-[200px] transition-colors ${
          isOver ? 'bg-primary/10 ring-2 ring-primary/30' : 'bg-muted/50'
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No tasks</p>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
            ))
          )}
        </SortableContext>
        {onQuickAdd && (
          <button
            onClick={onQuickAdd}
            className="mt-1 w-full rounded-md border border-dashed border-muted-foreground/30 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Board ──

export function TaskBoard({ projectId, onTaskClick, onQuickAdd, refreshKey }: TaskBoardProps) {
  const [tasks, setTasks] = React.useState<TaskItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTask, setActiveTask] = React.useState<TaskItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  React.useEffect(() => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiGet<TaskItem[]>(`/api/projects/${projectId}/tasks?limit=500&sort=position&dir=asc`)
      .then((res) => setTasks(res.data))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [projectId, refreshKey]);

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const overColumn = TASK_COLUMNS.find((c) => c.status === overId);
    if (overColumn) {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: overColumn.status } : t))
      );
      return;
    }

    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: overTask.status } : t))
      );
    }
  }

  async function handleDragEnd(_event: DragEndEvent) {
    setActiveTask(null);

    const grouped = new Map<string, TaskItem[]>();
    for (const task of tasks) {
      const list = grouped.get(task.status) ?? [];
      list.push(task);
      grouped.set(task.status, list);
    }

    const reorderItems: { id: string; status: string; position: number }[] = [];
    for (const [status, columnTasks] of grouped) {
      columnTasks.forEach((task, index) => {
        reorderItems.push({ id: task.id, status, position: index });
      });
    }

    if (projectId && reorderItems.length > 0) {
      try {
        await apiPost(`/api/projects/${projectId}/tasks/reorder`, { items: reorderItems });
      } catch {
        apiGet<TaskItem[]>(`/api/projects/${projectId}/tasks?limit=500&sort=position&dir=asc`)
          .then((res) => setTasks(res.data))
          .catch(() => {});
      }
    }
  }

  if (loading) return <LoadingSpinner size="lg" label="Loading tasks..." />;

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">Select a project to view the task board.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
          return (
            <DroppableColumn
              key={col.status}
              status={col.status}
              label={col.label}
              color={col.color}
              tasks={columnTasks}
              onTaskClick={onTaskClick}
              onQuickAdd={onQuickAdd ? () => onQuickAdd(col.status) : undefined}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <Card className="w-72 shadow-lg rotate-2">
            <CardContent className="p-3">
              <p className="text-sm font-medium">{activeTask.title}</p>
              <Badge className={`mt-1 text-xs ${PRIORITY_COLORS[activeTask.priority] ?? ''}`}>
                {activeTask.priority}
              </Badge>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
