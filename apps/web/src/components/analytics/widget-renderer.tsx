'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@ccd/ui';
import { Button } from '@ccd/ui';
import { Trash2, Loader2, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const MODULE_COLOR = '#8B5CF6';

const CHART_COLORS = [
  '#8B5CF6',
  '#3B82F6',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];

// ── Types ─────────────────────────────────────────────────────────

export interface Widget {
  id: string;
  dashboard_id: string;
  title: string;
  widget_type: string;
  data_source: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
  created_at: string;
}

export interface WidgetData {
  value: number;
  label: string;
  data?: Array<{ label: string; value: number }>;
}

interface WidgetRendererProps {
  widget: Widget;
  onRemove?: () => void;
  data?: WidgetData | null;
  isLoading?: boolean;
  error?: string | null;
}

// ── Sample Data ───────────────────────────────────────────────────
// Fallback demo data used ONLY when no real `data` prop is provided.

const SAMPLE_TIME_SERIES = [
  { name: 'Mon', value: 120 },
  { name: 'Tue', value: 210 },
  { name: 'Wed', value: 185 },
  { name: 'Thu', value: 290 },
  { name: 'Fri', value: 340 },
  { name: 'Sat', value: 250 },
  { name: 'Sun', value: 310 },
];

const SAMPLE_PIE_DATA = [
  { name: 'Organic', value: 45 },
  { name: 'Paid', value: 25 },
  { name: 'Social', value: 20 },
  { name: 'Referral', value: 10 },
];

const SAMPLE_TABLE_DATA = [
  { label: 'Homepage', visits: 3420, bounce: '32%' },
  { label: '/pricing', visits: 1890, bounce: '41%' },
  { label: '/blog', visits: 1540, bounce: '28%' },
  { label: '/contact', visits: 980, bounce: '55%' },
  { label: '/docs', visits: 870, bounce: '22%' },
];

// ── Widget Type Badge Label ───────────────────────────────────────

const WIDGET_TYPE_LABELS: Record<string, string> = {
  line_chart: 'Line Chart',
  bar_chart: 'Bar Chart',
  pie_chart: 'Pie Chart',
  area_chart: 'Area Chart',
  stat_card: 'Stat Card',
  table: 'Table',
  metric: 'Metric',
};

// ── Tooltip Style ─────────────────────────────────────────────────

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: 12,
};

// ── Helpers ───────────────────────────────────────────────────────

/** Convert WidgetData.data array to recharts-compatible format */
function toChartData(
  data: Array<{ label: string; value: number }> | undefined
): Array<{ name: string; value: number }> {
  if (!data || data.length === 0) return SAMPLE_TIME_SERIES;
  return data.map((d) => ({ name: d.label, value: d.value }));
}

function toPieData(
  data: Array<{ label: string; value: number }> | undefined
): Array<{ name: string; value: number }> {
  if (!data || data.length === 0) return SAMPLE_PIE_DATA;
  return data.map((d) => ({ name: d.label, value: d.value }));
}

// ── Component ─────────────────────────────────────────────────────

export function WidgetRenderer({
  widget,
  onRemove,
  data,
  isLoading,
  error: errorMsg,
}: WidgetRendererProps) {
  const typeLabel = WIDGET_TYPE_LABELS[widget.widget_type] ?? widget.widget_type;
  const hasRealData = data != null;
  const isDemo = !hasRealData && !isLoading && !errorMsg;

  function renderContent() {
    // Loading state
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mb-2" />
          <p className="text-xs">Loading data...</p>
        </div>
      );
    }

    // Error state
    if (errorMsg) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-destructive">
          <AlertCircle className="h-6 w-6 mb-2" />
          <p className="text-xs text-center max-w-[180px]">{errorMsg}</p>
        </div>
      );
    }

    // Use real data when available, fall back to sample data
    const chartData = hasRealData ? toChartData(data.data) : SAMPLE_TIME_SERIES;
    const pieData = hasRealData ? toPieData(data.data) : SAMPLE_PIE_DATA;

    switch (widget.widget_type) {
      case 'line_chart':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={MODULE_COLOR}
                strokeWidth={2}
                dot={{ r: 3, fill: MODULE_COLOR }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar_chart':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="value"
                fill={MODULE_COLOR}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area_chart':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={MODULE_COLOR}
                fill={MODULE_COLOR}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie_chart':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                nameKey="name"
                paddingAngle={2}
                label={(props) =>
                  `${props.name ?? ''} ${(((props.percent as number) ?? 0) * 100).toFixed(0)}%`
                }
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'stat_card': {
        const displayValue = hasRealData
          ? data.value.toLocaleString()
          : '1,284';
        const displayLabel = hasRealData
          ? data.label
          : widget.data_source || 'Total items';

        return (
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-4xl font-bold" style={{ color: MODULE_COLOR }}>
              {displayValue}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {displayLabel}
            </p>
            {!hasRealData && (
              <p className="mt-2 text-xs text-green-600 font-medium">
                +12.5% from last period
              </p>
            )}
          </div>
        );
      }

      case 'metric': {
        const currentValue = hasRealData
          ? data.value.toLocaleString()
          : '89.2%';
        const currentLabel = hasRealData ? data.label : 'Current';

        return (
          <div className="flex items-center gap-6 py-6 px-2">
            <div className="flex-1 text-center">
              <p className="text-3xl font-bold" style={{ color: MODULE_COLOR }}>
                {currentValue}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{currentLabel}</p>
            </div>
            {!hasRealData && (
              <>
                <div className="h-12 w-px bg-border" />
                <div className="flex-1 text-center">
                  <p className="text-3xl font-bold text-muted-foreground">
                    82.1%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Previous</p>
                </div>
              </>
            )}
          </div>
        );
      }

      case 'table': {
        if (hasRealData && data.data && data.data.length > 0) {
          return (
            <div className="overflow-auto max-h-[240px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Label</th>
                    <th className="pb-2 font-medium text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((row) => (
                    <tr key={row.label} className="border-b last:border-0">
                      <td className="py-2 font-medium">{row.label}</td>
                      <td className="py-2 text-right text-muted-foreground">
                        {row.value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Fallback sample table
        return (
          <div className="overflow-auto max-h-[240px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Page</th>
                  <th className="pb-2 font-medium text-right">Visits</th>
                  <th className="pb-2 font-medium text-right">Bounce</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_TABLE_DATA.map((row) => (
                  <tr key={row.label} className="border-b last:border-0">
                    <td className="py-2 font-medium">{row.label}</td>
                    <td className="py-2 text-right text-muted-foreground">
                      {row.visits.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      {row.bounce}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      default:
        return (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">
              Unknown widget type: {widget.widget_type}
            </p>
          </div>
        );
    }
  }

  const ariaLabel = hasRealData
    ? `${widget.title}: ${data.label} ${data.value}`
    : `${widget.title} widget`;

  return (
    <Card className="h-full flex flex-col" aria-label={ariaLabel}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          <Badge variant="secondary" className="text-[10px] font-normal">
            {typeLabel}
          </Badge>
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label={`Remove ${widget.title} widget`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div role="img" aria-label={`${typeLabel} for ${widget.title}`}>
          {renderContent()}
        </div>
        {widget.data_source && (
          <p className="mt-2 text-[10px] text-muted-foreground/60 text-center">
            Source: {widget.data_source}{isDemo ? ' (demo data)' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
