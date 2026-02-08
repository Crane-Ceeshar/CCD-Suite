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
  width?: number;
  editable?: boolean;
  editType?: 'text' | 'select' | 'currency' | 'date';
  editOptions?: { value: string; label: string }[];
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
  /** @deprecated Use stickyColumns instead */
  stickyFirstColumn?: boolean;
  stickyColumns?: number;
  columnDraggable?: boolean;
  onColumnReorder?: (keys: string[]) => void;
  onCellEdit?: (item: T, key: string, value: unknown) => void;
}

/* ------------------------------------------------------------------ */
/*  Editable Cell Component                                            */
/* ------------------------------------------------------------------ */
function EditableCell({
  value,
  editType = 'text',
  editOptions,
  onSave,
  displayContent,
}: {
  value: unknown;
  editType: 'text' | 'select' | 'currency' | 'date';
  editOptions?: { value: string; label: string }[];
  onSave: (newValue: unknown) => void;
  displayContent: React.ReactNode;
}) {
  const [editing, setEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement | HTMLSelectElement>(null);

  function startEditing(e: React.MouseEvent) {
    e.stopPropagation();
    if (editType === 'currency') {
      // Strip formatting, show raw number
      const num = typeof value === 'number' ? value : parseFloat(String(value ?? '0'));
      setEditValue(isNaN(num) ? '' : String(num));
    } else {
      setEditValue(String(value ?? ''));
    }
    setEditing(true);
  }

  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [editing]);

  function handleSave() {
    setEditing(false);
    let finalValue: unknown = editValue;
    if (editType === 'currency') {
      const parsed = parseFloat(editValue);
      finalValue = isNaN(parsed) ? 0 : parsed;
    }
    if (finalValue !== value) {
      onSave(finalValue);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditing(false);
    }
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newVal = e.target.value;
    setEditing(false);
    if (newVal !== String(value ?? '')) {
      onSave(newVal);
    }
  }

  if (editing) {
    if (editType === 'select' && editOptions) {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={handleSelectChange}
          onBlur={() => setEditing(false)}
          onClick={(e) => e.stopPropagation()}
          className="h-8 w-full text-sm border rounded px-2 bg-transparent focus:ring-1 focus:ring-primary focus:outline-none appearance-none cursor-pointer"
        >
          {editOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={editType === 'date' ? 'date' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="h-8 w-full text-sm border rounded px-2 bg-transparent focus:ring-1 focus:ring-primary focus:outline-none"
      />
    );
  }

  return (
    <div
      onClick={startEditing}
      className="cursor-pointer rounded px-1 -mx-1 py-0.5 hover:ring-1 hover:ring-border hover:bg-muted/30 transition-colors min-h-[28px] flex items-center"
    >
      {displayContent}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sticky column helpers                                              */
/* ------------------------------------------------------------------ */

/** Non-draggable column keys that should never participate in column DnD */
const NON_DRAGGABLE_COLUMN_KEYS = new Set(['select', 'actions']);

const DRAG_HANDLE_WIDTH = 36;

function getStickyStyle(
  stickyColumns: number,
  draggable: boolean,
  columnIndex: number,
  isDragHandleColumn: boolean,
  columns: { width?: number }[]
): { className: string; style: React.CSSProperties } {
  if (stickyColumns <= 0) return { className: '', style: {} };

  if (draggable) {
    // With row drag: index 0 is drag handle
    if (isDragHandleColumn) {
      return {
        className: 'sticky z-10 bg-background',
        style: { left: 0 },
      };
    }

    // Calculate cumulative left offset for this column
    // Start after drag handle (36px)
    if (columnIndex < stickyColumns) {
      let left = DRAG_HANDLE_WIDTH;
      for (let i = 0; i < columnIndex; i++) {
        left += columns[i]?.width ?? 100;
      }
      const isLastSticky = columnIndex === stickyColumns - 1;
      return {
        className: cn(
          'sticky z-10 bg-background',
          isLastSticky &&
            'after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-border'
        ),
        style: { left },
      };
    }
  } else {
    // No row drag: direct column indices
    if (columnIndex < stickyColumns) {
      let left = 0;
      for (let i = 0; i < columnIndex; i++) {
        left += columns[i]?.width ?? 100;
      }
      const isLastSticky = columnIndex === stickyColumns - 1;
      return {
        className: cn(
          'sticky z-10 bg-background',
          isLastSticky &&
            'after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-border'
        ),
        style: { left },
      };
    }
  }

  return { className: '', style: {} };
}

/* ------------------------------------------------------------------ */
/*  Sortable Header Cell (for column reorder)                         */
/* ------------------------------------------------------------------ */
function SortableHeaderCell<T>({
  column,
  sortKey,
  sortDirection,
  onSort,
  stickyClassName,
  stickyStyle,
}: {
  column: Column<T>;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  stickyClassName?: string;
  stickyStyle?: React.CSSProperties;
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
    ...stickyStyle,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap cursor-grab',
        stickyClassName,
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
  stickyColumns,
  onCellEdit,
}: {
  item: T;
  itemId: string;
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  stickyColumns: number;
  onCellEdit?: (item: T, key: string, value: unknown) => void;
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

  const dragHandleSticky = stickyColumns > 0
    ? { className: 'sticky z-10 bg-background', style: { left: 0 } as React.CSSProperties }
    : { className: '', style: {} as React.CSSProperties };

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
      <td
        className={cn('w-[36px] p-2 align-middle whitespace-nowrap', dragHandleSticky.className)}
        style={dragHandleSticky.style}
      >
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
      {columns.map((column, colIdx) => {
        const sticky = getStickyStyle(stickyColumns, true, colIdx, false, columns);
        const cellContent = column.render
          ? column.render(item)
          : String(item[column.key] ?? '');

        return (
          <td
            key={column.key}
            className={cn(
              'p-4 align-middle whitespace-nowrap',
              sticky.className,
              column.className
            )}
            style={sticky.style}
          >
            {column.editable && onCellEdit ? (
              <EditableCell
                value={item[column.key]}
                editType={column.editType ?? 'text'}
                editOptions={column.editOptions}
                onSave={(newValue) => onCellEdit(item, column.key, newValue)}
                displayContent={cellContent}
              />
            ) : (
              cellContent
            )}
          </td>
        );
      })}
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
    <table className="w-max min-w-full text-sm">
      <tbody>
        <tr className="border rounded-md bg-background shadow-xl ring-2 ring-primary/30">
          <td className="w-[36px] p-2 align-middle whitespace-nowrap">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </td>
          {columns.map((column) => (
            <td key={column.key} className={cn('p-4 align-middle whitespace-nowrap', column.className)}>
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
  stickyColumns: stickyColumnsProp,
  columnDraggable,
  onColumnReorder,
  onCellEdit,
  className,
  ...props
}: DataTableProps<T>) {
  // Support both legacy stickyFirstColumn and new stickyColumns
  const stickyColumns = stickyColumnsProp ?? (stickyFirstColumn ? 1 : 0);

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
        // Exclude sticky columns
        if (idx < stickyColumns) return false;
        return true;
      })
      .map((col) => col.key);
  }, [columnDraggable, orderedColumns, stickyColumns]);

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
      {draggable && (() => {
        const dragHandleSticky = getStickyStyle(stickyColumns, true, 0, true, renderColumns);
        return (
          <th
            className={cn(
              'w-[36px] h-12 px-2 text-left align-middle font-medium text-muted-foreground whitespace-nowrap',
              dragHandleSticky.className
            )}
            style={dragHandleSticky.style}
          />
        );
      })()}
      {renderColumns.map((column, colIdx) => {
        const sticky = getStickyStyle(
          stickyColumns,
          !!draggable,
          colIdx,
          false,
          renderColumns
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
              stickyClassName={sticky.className}
              stickyStyle={sticky.style}
            />
          );
        }

        return (
          <th
            key={column.key}
            className={cn(
              'h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap',
              sticky.className,
              column.className
            )}
            style={sticky.style}
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
        {draggable && (() => {
          const dragHandleSticky = getStickyStyle(stickyColumns, true, 0, true, renderColumns);
          return (
            <td
              className={cn('p-2 whitespace-nowrap', dragHandleSticky.className)}
              style={dragHandleSticky.style}
            >
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            </td>
          );
        })()}
        {renderColumns.map((col, colIdx) => {
          const sticky = getStickyStyle(stickyColumns, !!draggable, colIdx, false, renderColumns);
          return (
            <td
              key={col.key}
              className={cn('p-4 whitespace-nowrap', sticky.className)}
              style={sticky.style}
            >
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </td>
          );
        })}
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
          stickyColumns={stickyColumns}
          onCellEdit={onCellEdit}
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
        {renderColumns.map((column, colIdx) => {
          const sticky = getStickyStyle(stickyColumns, !!draggable, colIdx, false, renderColumns);
          const cellContent = column.render
            ? column.render(item)
            : String(item[column.key] ?? '');

          return (
            <td
              key={column.key}
              className={cn(
                'p-4 align-middle whitespace-nowrap',
                sticky.className,
                column.className
              )}
              style={sticky.style}
            >
              {column.editable && onCellEdit ? (
                <EditableCell
                  value={item[column.key]}
                  editType={column.editType ?? 'text'}
                  editOptions={column.editOptions}
                  onSave={(newValue) => onCellEdit(item, column.key, newValue)}
                  displayContent={cellContent}
                />
              ) : (
                cellContent
              )}
            </td>
          );
        })}
      </tr>
    ))
  );

  const tableContent = (
    <div className={cn('rounded-md border', className)} {...props}>
      <div className="relative w-full overflow-auto">
        <table className="w-max min-w-full caption-bottom text-sm">
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
