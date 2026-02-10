'use client';

import * as React from 'react';
import { Button } from '@ccd/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── Color mapping for content types ──────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  article: '#3B82F6',
  blog_post: '#8B5CF6',
  social_post: '#F59E0B',
  email: '#EC4899',
  landing_page: '#10B981',
  ad_copy: '#EF4444',
  video_script: '#6366F1',
};

interface CalendarItem {
  id: string;
  title: string;
  content_type: string;
  status: string;
  publish_date: string;
  category: { id: string; name: string; color: string } | null;
}

interface EditorialCalendarProps {
  items: CalendarItem[];
  month: Date;
  onMonthChange: (date: Date) => void;
}

// ── Helpers ──────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

// ── Component ────────────────────────────────────────────────────

export function EditorialCalendar({ items, month, onMonthChange }: EditorialCalendarProps) {
  const router = useRouter();
  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const daysInMonth = getDaysInMonth(year, monthIdx);
  const firstDay = getFirstDayOfMonth(year, monthIdx);

  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function prevMonth() {
    onMonthChange(new Date(year, monthIdx - 1, 1));
  }

  function nextMonth() {
    onMonthChange(new Date(year, monthIdx + 1, 1));
  }

  function goToday() {
    const now = new Date();
    onMonthChange(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  // Group items by date
  const itemsByDate = new Map<string, CalendarItem[]>();
  for (const item of items) {
    if (!item.publish_date) continue;
    const dateKey = item.publish_date.slice(0, 10);
    const arr = itemsByDate.get(dateKey) ?? [];
    arr.push(item);
    itemsByDate.set(dateKey, arr);
  }

  // Build calendar grid cells
  const cells: Array<{ date: Date | null; items: CalendarItem[] }> = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push({ date: null, items: [] });
  }

  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIdx, d);
    const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ date, items: itemsByDate.get(key) ?? [] });
  }

  // Fill remaining cells to complete the grid
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 0; i < remaining; i++) {
      cells.push({ date: null, items: [] });
    }
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center" aria-live="polite">{monthLabel}</h2>
          <Button variant="outline" size="sm" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday}>
            Today
          </Button>
        </div>

        {/* Legend */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize text-muted-foreground">{type.replace(/_/g, ' ')}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Calendar Grid ──────────────────────────── */}
      <div className="rounded-lg border" role="grid" aria-label={`Editorial calendar for ${monthLabel}`}>
        {/* Week headers */}
        <div className="grid grid-cols-7 border-b bg-muted/30" role="row">
          {weekDays.map((day) => (
            <div key={day} role="columnheader" className="px-2 py-2 text-xs font-medium text-muted-foreground text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const dateLabel = cell.date
              ? cell.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : undefined;
            const itemCount = cell.items.length;

            return (
            <div
              key={idx}
              role="gridcell"
              aria-label={dateLabel ? `${dateLabel}${itemCount > 0 ? `, ${itemCount} item${itemCount !== 1 ? 's' : ''}` : ''}` : undefined}
              tabIndex={cell.date ? 0 : undefined}
              className={`min-h-[100px] border-b border-r p-1.5 ${
                cell.date == null ? 'bg-muted/10' : 'bg-background'
              } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
            >
              {cell.date && (
                <>
                  <button
                    className={`mb-1 text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday(cell.date)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                    onClick={() => {
                      const d = cell.date!;
                      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      router.push(`/content/editor?publish_date=${dateStr}`);
                    }}
                  >
                    {cell.date.getDate()}
                  </button>

                  <div className="space-y-0.5">
                    {cell.items.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        className="w-full text-left"
                        onClick={() => router.push(`/content/editor?id=${item.id}`)}
                      >
                        <div
                          className="rounded px-1.5 py-0.5 text-xs truncate text-white"
                          style={{ backgroundColor: TYPE_COLORS[item.content_type] ?? '#6B7280' }}
                          title={item.title}
                        >
                          {item.title}
                        </div>
                      </button>
                    ))}
                    {cell.items.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-1">
                        +{cell.items.length - 3} more
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
