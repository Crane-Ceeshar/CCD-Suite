'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface CompletionTrendChartProps {
  data: Array<{ period: string; completed: number; created: number }>;
}

export function CompletionTrendChart({ data }: CompletionTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No trend data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#A5B4FC" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#A5B4FC" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 12 }}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: 12,
          }}
        />
        <Legend
          verticalAlign="top"
          height={30}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="created"
          name="Created"
          stroke="#A5B4FC"
          fill="url(#colorCreated)"
          strokeWidth={2}
          dot={{ r: 3, fill: '#A5B4FC' }}
        />
        <Area
          type="monotone"
          dataKey="completed"
          name="Completed"
          stroke="#6366F1"
          fill="url(#colorCompleted)"
          strokeWidth={2}
          dot={{ r: 3, fill: '#6366F1' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
