'use client';

import * as React from 'react';
import { Card, CardContent, Button, Input, Badge, ConfirmationDialog } from '@ccd/ui';
import { GripVertical, Plus, X } from 'lucide-react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WidgetRenderer, type Widget } from './widget-renderer';

// ── Types ─────────────────────────────────────────────────────────

interface DashboardGridProps {
  dashboardId: string;
  widgets: Widget[];
  onWidgetsChange: (widgets: Widget[]) => void;
  isEditing: boolean;
}

const WIDGET_TYPE_OPTIONS = [
  { value: 'line_chart', label: 'Line Chart' },
  { value: 'bar_chart', label: 'Bar Chart' },
  { value: 'pie_chart', label: 'Pie Chart' },
  { value: 'area_chart', label: 'Area Chart' },
  { value: 'stat_card', label: 'Stat Card' },
  { value: 'table', label: 'Table' },
  { value: 'metric', label: 'Metric' },
];

// ── Sortable Widget Wrapper ───────────────────────────────────────

function SortableWidget({
  widget,
  isEditing,
  onRemove,
}: {
  widget: Widget;
  isEditing: boolean;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    gridColumn: `span ${Math.min(widget.position?.w ?? 4, 12)}`,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {isEditing && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
          <button
            {...attributes}
            {...listeners}
            aria-label={`Drag to reorder ${widget.title}`}
            className="cursor-grab active:cursor-grabbing rounded bg-background/80 backdrop-blur-sm p-1 shadow-sm border border-border/50 hover:bg-accent transition-colors touch-none"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <ConfirmationDialog
            trigger={
              <button
                className="rounded bg-background/80 backdrop-blur-sm p-1 shadow-sm border border-border/50 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            }
            title="Remove Widget"
            description={`Remove "${widget.title}" from this dashboard?`}
            confirmLabel="Remove"
            variant="destructive"
            onConfirm={onRemove}
          />
        </div>
      )}
      <WidgetRenderer
        widget={widget}
        onRemove={isEditing ? onRemove : undefined}
      />
    </div>
  );
}

// ── Add Widget Form ───────────────────────────────────────────────

function AddWidgetForm({
  onAdd,
  onCancel,
}: {
  onAdd: (data: { title: string; widget_type: string; data_source: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = React.useState('');
  const [widgetType, setWidgetType] = React.useState('stat_card');
  const [dataSource, setDataSource] = React.useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      widget_type: widgetType,
      data_source: dataSource.trim(),
    });
    setTitle('');
    setWidgetType('stat_card');
    setDataSource('');
  }

  return (
    <Card className="border-dashed border-2">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Widget
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Revenue Overview"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Widget Type
            </label>
            <select
              value={widgetType}
              onChange={(e) => setWidgetType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {WIDGET_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Data Source
            </label>
            <Input
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value)}
              placeholder="e.g. crm.revenue, social.engagement"
              className="h-9"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button type="submit" size="sm" disabled={!title.trim()}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────

export function DashboardGrid({
  dashboardId,
  widgets,
  onWidgetsChange,
  isEditing,
}: DashboardGridProps) {
  const [showAddForm, setShowAddForm] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(widgets, oldIndex, newIndex);
    onWidgetsChange(reordered);
  }

  function handleRemoveWidget(widgetId: string) {
    onWidgetsChange(widgets.filter((w) => w.id !== widgetId));
  }

  function handleAddWidget(data: {
    title: string;
    widget_type: string;
    data_source: string;
  }) {
    // Build an optimistic widget for immediate rendering.
    // The parent page will POST it to the API and reconcile with the real id.
    const tempWidget: Widget = {
      id: `temp-${Date.now()}`,
      dashboard_id: dashboardId,
      title: data.title,
      widget_type: data.widget_type,
      data_source: data.data_source,
      config: {},
      position: { x: 0, y: 0, w: 4, h: 3 },
      created_at: new Date().toISOString(),
    };

    onWidgetsChange([...widgets, tempWidget]);
    setShowAddForm(false);
  }

  if (widgets.length === 0 && !isEditing) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">
          No widgets yet. Toggle edit mode to start adding widgets.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Widget Count Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={widgets.map((w) => w.id)}
          strategy={rectSortingStrategy}
        >
          <div
            role="list"
            aria-label="Dashboard widgets"
            className="grid gap-4"
            style={{
              gridTemplateColumns: 'repeat(12, 1fr)',
            }}
          >
            {widgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                isEditing={isEditing}
                onRemove={() => handleRemoveWidget(widget.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Widget Section */}
      {isEditing && (
        <div className="pt-2">
          {showAddForm ? (
            <div className="max-w-md">
              <AddWidgetForm
                onAdd={handleAddWidget}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          ) : (
            <Button
              variant="outline"
              className="border-dashed"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Widget
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
