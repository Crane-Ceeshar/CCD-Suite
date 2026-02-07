import * as React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../primitives/button';
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

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  draggable?: boolean;
  onReorder?: (items: T[]) => void;
}

/* ------------------------------------------------------------------ */
/*  Sortable Row                                                      */
/* ------------------------------------------------------------------ */
function SortableRow<T extends Record<string, unknown>>({
  item,
  itemId,
  columns,
  onRowClick,
}: {
  item: T;
  itemId: string;
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-b transition-colors hover:bg-muted/50',
        onRowClick && 'cursor-pointer'
      )}
      onClick={() => onRowClick?.(item)}
    >
      {/* Drag handle cell */}
      <td className="w-[36px] p-2 align-middle">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="flex items-center justify-center cursor-grab active:cursor-grabbing touch-none rounded p-1 hover:bg-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        </button>
      </td>
      {columns.map((column) => (
        <td key={column.key} className={cn('p-4 align-middle', column.className)}>
          {column.render
            ? column.render(item)
            : String(item[column.key] ?? '')}
        </td>
      ))}
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Drag Overlay Row                                                  */
/* ------------------------------------------------------------------ */
function DragOverlayRow<T extends Record<string, unknown>>({
  item,
  columns,
}: {
  item: T;
  columns: Column<T>[];
}) {
  return (
    <table className="w-full text-sm">
      <tbody>
        <tr className="border rounded-md bg-background shadow-xl ring-2 ring-primary/30">
          <td className="w-[36px] p-2 align-middle">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </td>
          {columns.map((column) => (
            <td key={column.key} className={cn('p-4 align-middle', column.className)}>
              {column.render
                ? column.render(item)
                : String(item[column.key] ?? '')}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------------ */
/*  DataTable                                                         */
/* ------------------------------------------------------------------ */
function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  onSort,
  sortKey,
  sortDirection,
  onRowClick,
  emptyMessage = 'No data found',
  loading,
  draggable,
  onReorder,
  className,
  ...props
}: DataTableProps<T>) {
  const [activeItem, setActiveItem] = React.useState<T | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleSort = (key: string) => {
    if (!onSort) return;
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  const ids = React.useMemo(() => data.map(keyExtractor), [data, keyExtractor]);

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    const item = data.find((d) => keyExtractor(d) === id);
    if (item) setActiveItem(item);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(data, oldIndex, newIndex);
    onReorder?.(reordered);
  }

  const tableContent = (
    <div className={cn('rounded-md border', className)} {...props}>
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50">
              {draggable && (
                <th className="w-[36px] h-12 px-2 text-left align-middle font-medium text-muted-foreground" />
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
                    column.className
                  )}
                >
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort(column.key)}
                    >
                      {column.header}
                      {sortKey === column.key ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {draggable && (
                    <td className="p-2">
                      <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="p-4">
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (draggable ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : draggable ? (
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                {data.map((item) => (
                  <SortableRow
                    key={keyExtractor(item)}
                    item={item}
                    itemId={keyExtractor(item)}
                    columns={columns}
                    onRowClick={onRowClick}
                  />
                ))}
              </SortableContext>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className={cn(
                    'border-b transition-colors hover:bg-muted/50',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={cn('p-4 align-middle', column.className)}>
                      {column.render
                        ? column.render(item)
                        : String(item[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (draggable) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {tableContent}
        <DragOverlay>
          {activeItem ? (
            <DragOverlayRow item={activeItem} columns={columns} />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  return tableContent;
}

export { DataTable };
