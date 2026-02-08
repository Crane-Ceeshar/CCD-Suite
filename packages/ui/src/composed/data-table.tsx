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
  horizontalListSortingStrategy,
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
  stickyFirstColumn?: boolean;
  columnDraggable?: boolean;
  onColumnReorder?: (keys: string[]) => void;
}

/* ------------------------------------------------------------------ */
/*  Sticky column helpers                                              */
/* ------------------------------------------------------------------ */

/** Non-draggable column keys that should never participate in column DnD */
const NON_DRAGGABLE_COLUMN_KEYS = new Set(['select', 'actions']);

function getStickyClass(
  stickyFirstColumn: boolean,
  draggable: boolean,
  columnIndex: number,
  isDragHandleColumn: boolean
): string {
  if (!stickyFirstColumn) return '';

  if (draggable) {
    // With row drag: index 0 is drag handle, index 1 is first data column
    if (isDragHandleColumn) {
      return 'sticky left-0 z-10 bg-background';
    }
    if (columnIndex === 0) {
      // First data column (rendered at visual index 1 due to drag handle)
      return cn(
        'sticky left-[36px] z-10 bg-background',
        'after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-border'
      );
    }
  } else {
    // No row drag: index 0 is first data column
    if (columnIndex === 0) {
      return cn(
        'sticky left-0 z-10 bg-background',
        'after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-border'
      );
    }
  }

  return '';
}

/* ------------------------------------------------------------------ */
/*  Sortable Header Cell (for column reorder)                         */
/* ------------------------------------------------------------------ */
function SortableHeaderCell<T>({
  column,
  sortKey,
  sortDirection,
  onSort,
  stickyClass,
}: {
  column: Column<T>;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  stickyClass?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-grab',
        stickyClass,
        column.className
      )}
      {...attributes}
      {...listeners}
    >
      {column.sortable && onSort ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => onSort(column.key)}
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
  );
}

/* ------------------------------------------------------------------ */
/*  Sortable Row                                                      */
/* ------------------------------------------------------------------ */
function SortableRow<T extends Record<string, unknown>>({
  item,
  itemId,
  columns,
  onRowClick,
  stickyFirstColumn,
}: {
  item: T;
  itemId: string;
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  stickyFirstColumn?: boolean;
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

  const dragHandleStickyClass = stickyFirstColumn
    ? 'sticky left-0 z-10 bg-background'
    : '';

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
      <td className={cn('w-[36px] p-2 align-middle', dragHandleStickyClass)}>
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
      {columns.map((column, colIdx) => (
        <td
          key={column.key}
          className={cn(
            'p-4 align-middle',
            getStickyClass(!!stickyFirstColumn, true, colIdx, false),
            column.className
          )}
        >
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
  stickyFirstColumn,
  columnDraggable,
  onColumnReorder,
  className,
  ...props
}: DataTableProps<T>) {
  const [activeItem, setActiveItem] = React.useState<T | null>(null);

  /* ---- Column ordering state ---- */
  const [orderedColumnKeys, setOrderedColumnKeys] = React.useState<string[]>(
    () => columns.map((c) => c.key)
  );

  // Sync ordered keys when columns prop changes
  React.useEffect(() => {
    const newKeys = columns.map((c) => c.key);
    setOrderedColumnKeys((prev) => {
      // If columns changed (different keys or different count), reset
      const prevSet = new Set(prev);
      const newSet = new Set(newKeys);
      if (
        prev.length !== newKeys.length ||
        newKeys.some((k) => !prevSet.has(k)) ||
        prev.some((k) => !newSet.has(k))
      ) {
        return newKeys;
      }
      return prev;
    });
  }, [columns]);

  // Build ordered columns array
  const orderedColumns = React.useMemo(() => {
    if (!columnDraggable) return columns;
    const columnMap = new Map(columns.map((c) => [c.key, c]));
    return orderedColumnKeys
      .map((key) => columnMap.get(key))
      .filter((c): c is Column<T> => c != null);
  }, [columnDraggable, columns, orderedColumnKeys]);

  // Determine which columns are draggable (for column DnD)
  const draggableColumnKeys = React.useMemo(() => {
    if (!columnDraggable) return [];
    return orderedColumns
      .filter((col, idx) => {
        // Exclude non-draggable keys (select, actions)
        if (NON_DRAGGABLE_COLUMN_KEYS.has(col.key)) return false;
        // Exclude sticky first column
        if (stickyFirstColumn && idx === 0) return false;
        return true;
      })
      .map((col) => col.key);
  }, [columnDraggable, orderedColumns, stickyFirstColumn]);

  /* ---- Row DnD sensors ---- */
  const rowSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  /* ---- Column DnD sensors ---- */
  const columnSensors = useSensors(
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

  function handleColumnDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedColumnKeys((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(prev, oldIndex, newIndex);
      onColumnReorder?.(reordered);
      return reordered;
    });
  }

  /* ---- Use orderedColumns for rendering when columnDraggable ---- */
  const renderColumns = columnDraggable ? orderedColumns : columns;

  /* ---- Header row ---- */
  const headerCells = (
    <>
      {draggable && (
        <th
          className={cn(
            'w-[36px] h-12 px-2 text-left align-middle font-medium text-muted-foreground',
            stickyFirstColumn ? 'sticky left-0 z-10 bg-background' : ''
          )}
        />
      )}
      {renderColumns.map((column, colIdx) => {
        const stickyClass = getStickyClass(
          !!stickyFirstColumn,
          !!draggable,
          colIdx,
          false
        );
        const isColumnDraggable =
          columnDraggable && draggableColumnKeys.includes(column.key);

        if (isColumnDraggable) {
          return (
            <SortableHeaderCell
              key={column.key}
              column={column}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={onSort ? handleSort : undefined}
              stickyClass={stickyClass}
            />
          );
        }

        return (
          <th
            key={column.key}
            className={cn(
              'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
              stickyClass,
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
        );
      })}
    </>
  );

  const headerRow = (
    <tr className="border-b transition-colors hover:bg-muted/50">
      {headerCells}
    </tr>
  );

  const theadContent = columnDraggable ? (
    <DndContext
      sensors={columnSensors}
      collisionDetection={closestCenter}
      onDragEnd={handleColumnDragEnd}
    >
      <SortableContext
        items={draggableColumnKeys}
        strategy={horizontalListSortingStrategy}
      >
        {headerRow}
      </SortableContext>
    </DndContext>
  ) : (
    headerRow
  );

  /* ---- Body rows ---- */
  const bodyContent = loading ? (
    Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="border-b">
        {draggable && (
          <td className={cn('p-2', stickyFirstColumn ? 'sticky left-0 z-10 bg-background' : '')}>
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
          </td>
        )}
        {renderColumns.map((col, colIdx) => (
          <td
            key={col.key}
            className={cn(
              'p-4',
              getStickyClass(!!stickyFirstColumn, !!draggable, colIdx, false)
            )}
          >
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
          </td>
        ))}
      </tr>
    ))
  ) : data.length === 0 ? (
    <tr>
      <td
        colSpan={renderColumns.length + (draggable ? 1 : 0)}
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
          columns={renderColumns}
          onRowClick={onRowClick}
          stickyFirstColumn={stickyFirstColumn}
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
        {renderColumns.map((column, colIdx) => (
          <td
            key={column.key}
            className={cn(
              'p-4 align-middle',
              getStickyClass(!!stickyFirstColumn, !!draggable, colIdx, false),
              column.className
            )}
          >
            {column.render
              ? column.render(item)
              : String(item[column.key] ?? '')}
          </td>
        ))}
      </tr>
    ))
  );

  const tableContent = (
    <div className={cn('rounded-md border', className)} {...props}>
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            {theadContent}
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {bodyContent}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (draggable) {
    return (
      <DndContext
        sensors={rowSensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {tableContent}
        <DragOverlay>
          {activeItem ? (
            <DragOverlayRow item={activeItem} columns={renderColumns} />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  return tableContent;
}

export { DataTable };
