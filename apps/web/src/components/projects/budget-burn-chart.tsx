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
  ReferenceLine,
} from 'recharts';

interface BudgetBurnChartProps {
  totalCost: number;
  budget: number | null;
  costByMonth: Array<{ month: string; cost: number; cumulative: number }>;
}

export function BudgetBurnChart({ totalCost, budget, costByMonth }: BudgetBurnChartProps) {
  if (costByMonth.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No cost data available</p>
      </div>
    );
  }

  const alertThreshold = budget ? budget * 0.8 : null;

  const formatMoney = (v: number) =>
    `$${v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : v.toLocaleString()}`;

  // Determine area fill based on whether cost exceeds 80% of budget
  const isOverBudgetAlert = budget !== null && totalCost >= budget * 0.8;

  return (
    <div>
      {budget !== null && (
        <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
          <span>Budget: {formatMoney(budget)}</span>
          <span>Spent: {formatMoney(totalCost)}</span>
          <span
            className={
              totalCost >= budget
                ? 'text-red-600 font-medium'
                : totalCost >= budget * 0.8
                  ? 'text-amber-600 font-medium'
                  : 'text-green-600 font-medium'
            }
          >
            {Math.round((totalCost / budget) * 100)}% used
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={costByMonth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={isOverBudgetAlert ? '#EF4444' : '#6366F1'}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={isOverBudgetAlert ? '#EF4444' : '#6366F1'}
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
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
            tickFormatter={formatMoney}
          />
          <Tooltip
            formatter={(value) => [formatMoney(Number(value ?? 0)), 'Cumulative Cost']}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: 12,
            }}
          />
          {budget !== null && (
            <ReferenceLine
              y={budget}
              stroke="#EF4444"
              strokeDasharray="6 4"
              strokeWidth={2}
              label={{
                value: `Budget: ${formatMoney(budget)}`,
                position: 'insideTopRight',
                fill: '#EF4444',
                fontSize: 11,
              }}
            />
          )}
          {alertThreshold !== null && (
            <ReferenceLine
              y={alertThreshold}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: '80%',
                position: 'insideTopRight',
                fill: '#F59E0B',
                fontSize: 10,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="cumulative"
            name="Cumulative Cost"
            stroke={isOverBudgetAlert ? '#EF4444' : '#6366F1'}
            fill="url(#costGradient)"
            strokeWidth={2}
            dot={{ r: 3, fill: isOverBudgetAlert ? '#EF4444' : '#6366F1' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
