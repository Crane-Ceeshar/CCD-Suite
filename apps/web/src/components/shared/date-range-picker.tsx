'use client';

import * as React from 'react';
import { Button } from '@ccd/ui';
import { Calendar } from 'lucide-react';

export type PeriodValue = '7d' | '30d' | '90d' | 'ytd';

interface DateRangePickerProps {
  value: PeriodValue;
  onChange: (period: PeriodValue) => void;
  className?: string;
}

const presets: { value: PeriodValue; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'ytd', label: 'YTD' },
];

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  return (
    <div className={`flex items-center gap-1 rounded-lg border bg-background p-1 ${className ?? ''}`}>
      <Calendar className="ml-2 h-4 w-4 text-muted-foreground" />
      {presets.map((preset) => (
        <Button
          key={preset.value}
          variant={value === preset.value ? 'default' : 'ghost'}
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => onChange(preset.value)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
