'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface WorkloadChartProps {
  data: Array<{
    user_id: string;
    full_name: string;
    assigned_tasks: number;
    completed_tasks: number;
    hours_this_week: number;
    total_points: number;
  }>;
}

export function WorkloadChart({ data }: WorkloadChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No team workload data available</p>
      </div>
    );
  }

  const chartHeight = Math.max(300, data.length * 50);

  const chartData = data.map((member) => ({
    name: member.full_name,
    assigned: member.assigned_tasks,
    completed: member.completed_tasks,
    hours: member.hours_this_week,
  }));

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 12 }}
          stroke="hsl(var(--muted-foreground))"
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12 }}
          stroke="hsl(var(--muted-foreground))"
          width={120}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: 12,
          }}
          formatter={(value, name) => {
            if (name === 'Assigned') return [value, 'Assigned Tasks'];
            if (name === 'Completed') return [value, 'Completed Tasks'];
            return [value, String(name)];
          }}
          labelFormatter={(label) => String(label)}
        />
        <Legend
          verticalAlign="top"
          height={30}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar
          dataKey="assigned"
          name="Assigned"
          fill="#6366F1"
          radius={[0, 4, 4, 0]}
          barSize={16}
        />
        <Bar
          dataKey="completed"
          name="Completed"
          fill="#22C55E"
          radius={[0, 4, 4, 0]}
          barSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
