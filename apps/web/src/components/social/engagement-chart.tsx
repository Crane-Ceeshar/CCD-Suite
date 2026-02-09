'use client';

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

interface EngagementChartData {
  platform: string;
  likes: number;
  comments: number;
  shares: number;
}

interface EngagementChartProps {
  data: EngagementChartData[];
}

export function EngagementChart({ data }: EngagementChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No engagement data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="platform"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="capitalize"
        />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend />
        <Bar dataKey="likes" name="Likes" fill="#F59E0B" radius={[4, 4, 0, 0]} />
        <Bar dataKey="comments" name="Comments" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="shares" name="Shares" fill="#22C55E" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
