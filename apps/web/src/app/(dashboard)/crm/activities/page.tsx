'use client';

import * as React from 'react';
import {
  PageHeader,
  Button,
  Card,
  CardContent,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@ccd/ui';
import {
  Plus,
  Phone,
  Mail,
  CalendarDays,
  StickyNote,
  ListTodo,
  CheckCircle2,
  Circle,
  GripVertical,
} from 'lucide-react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { ActivityDialog } from '@/components/crm/activity-dialog';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ActivityRow {
  id: string;
  type: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
  deal?: { id: string; title: string } | null;
  contact?: { id: string; first_name: string; last_name: string } | null;
  company?: { id: string; name: string } | null;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <CalendarDays className="h-4 w-4" />,
  note: <StickyNote className="h-4 w-4" />,
  task: <ListTodo className="h-4 w-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  call: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  email: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  meeting: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  note: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  task: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

/* ------------------------------------------------------------------ */
/*  Sortable Activity Card                                             */
/* ------------------------------------------------------------------ */
function SortableActivityCard({
  activity,
  onToggleComplete,
  formatTime,
}: {
  activity: ActivityRow;
  onToggleComplete: (a: ActivityRow) => void;
  formatTime: (s: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="transition-shadow hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none rounded p-1 hover:bg-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
          </button>

          {/* Complete toggle */}
          <button
            className="mt-0.5 flex-shrink-0"
            onClick={() => onToggleComplete(activity)}
          >
            {activity.is_completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-muted-foreground" />
            )}
          </button>

          {/* Type icon */}
          <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${TYPE_COLORS[activity.type] ?? 'bg-muted text-muted-foreground'}`}>
            {TYPE_ICONS[activity.type] ?? <StickyNote className="h-4 w-4" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-sm font-medium ${activity.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                {activity.title}
              </p>
              <Badge variant="secondary" className="text-[10px]">
                {activity.type}
              </Badge>
            </div>
            {activity.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {activity.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/70">
              {activity.deal && <span>Deal: {activity.deal.title}</span>}
              {activity.contact && (
                <span>
                  Contact: {activity.contact.first_name} {activity.contact.last_name}
                </span>
              )}
              {activity.company && <span>Company: {activity.company.name}</span>}
            </div>
          </div>

          {/* Time */}
          <div className="text-xs text-muted-foreground flex-shrink-0">
            {activity.scheduled_at
              ? new Date(activity.scheduled_at).toLocaleDateString()
              : formatTime(activity.created_at)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ActivitiesPage() {
  const [activities, setActivities] = React.useState<ActivityRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('all');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [activeItem, setActiveItem] = React.useState<ActivityRow | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activityIds = React.useMemo(() => activities.map((a) => a.id), [activities]);

  function handleDragStart(event: DragStartEvent) {
    const item = activities.find((a) => a.id === (event.active.id as string));
    if (item) setActiveItem(item);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activityIds.indexOf(active.id as string);
    const newIndex = activityIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(activities, oldIndex, newIndex);
    setActivities(reordered);

    try {
      await apiPost('/api/crm/reorder', {
        table: 'activities',
        items: reordered.map((item, i) => ({ id: item.id, sort_order: i })),
      });
    } catch {
      setRefreshKey((k) => k + 1);
    }
  }

  const loadActivities = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('type', activeTab);
      const res = await apiGet<ActivityRow[]>(`/api/crm/activities?${params.toString()}`);
      setActivities(res.data);
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  React.useEffect(() => {
    loadActivities();
  }, [loadActivities, refreshKey]);

  async function toggleComplete(activity: ActivityRow) {
    try {
      await apiPatch(`/api/crm/activities/${activity.id}`, {
        is_completed: !activity.is_completed,
      });
      setRefreshKey((k) => k + 1);
    } catch { /* ignore */ }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activities"
        description="Track calls, meetings, emails, and tasks"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Activities' },
        ]}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Activity
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="call">Calls</TabsTrigger>
          <TabsTrigger value="email">Emails</TabsTrigger>
          <TabsTrigger value="meeting">Meetings</TabsTrigger>
          <TabsTrigger value="note">Notes</TabsTrigger>
          <TabsTrigger value="task">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          ) : activities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
              <p className="text-sm text-muted-foreground">No activities found</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={activityIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <SortableActivityCard
                      key={activity.id}
                      activity={activity}
                      onToggleComplete={toggleComplete}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeItem ? (
                  <Card className="shadow-xl ring-2 ring-primary/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${TYPE_COLORS[activeItem.type] ?? 'bg-muted text-muted-foreground'}`}>
                          {TYPE_ICONS[activeItem.type] ?? <StickyNote className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activeItem.title}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </TabsContent>
      </Tabs>

      <ActivityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
