'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface RankChartProps {
  data: { date: string; rank: number }[];
  keyword?: string;
}

export function RankChart({ data, keyword }: RankChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No rank history data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {keyword && (
        <p className="text-sm font-medium mb-2 text-muted-foreground">
          Rank history for &quot;{keyword}&quot;
        </p>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value: string) => {
              const d = new Date(value);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
          />
          <YAxis
            reversed
            tick={{ fontSize: 12 }}
            domain={['dataMin - 2', 'dataMax + 2']}
            label={{ value: 'Rank', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelFormatter={(label) => new Date(String(label)).toLocaleDateString()}
            formatter={(value) => [`#${value}`, 'Rank']}
          />
          <Line
            type="monotone"
            dataKey="rank"
            stroke="#9BBD2B"
            strokeWidth={2}
            dot={{ fill: '#9BBD2B', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
