'use client';

import { useState } from 'react';
import {
  PageHeader,
  StatCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@ccd/ui';
import {
  Calculator,
  DollarSign,
  Percent,
  FileText,
  TrendingUp,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTax, useExportFinance } from '@/hooks/use-finance';

const MODULE_COLOR = '#14B8A6';

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

function formatCurrency(value: number | undefined | null): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatPercent(value: number | undefined | null): string {
  return `${(value ?? 0).toFixed(2)}%`;
}

function formatNumber(value: number | undefined | null): string {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}

function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: MODULE_COLOR }}
      />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-11 w-11 rounded-lg" />
        </div>
        <Skeleton className="mt-3 h-3 w-24" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex gap-4">
              {Array.from({ length: cols }).map((_, c) => (
                <Skeleton key={c} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export default function TaxPage() {
  const [year, setYear] = useState<string>(String(currentYear));
  const [quarter, setQuarter] = useState<string>('all');

  const { data: rawTaxData, isLoading } = useTax(
    year,
    quarter === 'all' ? undefined : quarter
  );
  const taxData = rawTaxData?.data as {
    total_tax_collected?: number;
    total_revenue?: number;
    effective_tax_rate?: number;
    invoice_count?: number;
    quarterly_breakdown?: { quarter: string; tax_collected: number; revenue: number; invoice_count: number }[];
    by_rate?: { tax_rate: number; invoice_count: number; tax_collected: number; taxable_amount: number }[];
  } | undefined;

  const exportFinance = useExportFinance();

  const quarterlyData = taxData?.quarterly_breakdown ?? [];
  const byRateData = [...(taxData?.by_rate ?? [])].sort(
    (a: any, b: any) => a.tax_rate - b.tax_rate
  );

  const quarterlyTotals = quarterlyData.reduce(
    (acc: any, q: any) => ({
      tax_collected: acc.tax_collected + (q.tax_collected ?? 0),
      revenue: acc.revenue + (q.revenue ?? 0),
      invoice_count: acc.invoice_count + (q.invoice_count ?? 0),
    }),
    { tax_collected: 0, revenue: 0, invoice_count: 0 }
  );

  const handleExport = () => {
    exportFinance.mutate({ type: 'invoices' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax & Compliance"
        description="Tax calculations, reporting, and compliance management"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Tax' },
        ]}
      >
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exportFinance.isPending}
        >
          <Download className="mr-2 h-4 w-4" />
          {exportFinance.isPending ? 'Exporting...' : 'Export Tax Data'}
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="w-[140px]">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[140px]">
          <Select value={quarter} onValueChange={setQuarter}>
            <SelectTrigger>
              <SelectValue placeholder="All Quarters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quarters</SelectItem>
              <SelectItem value="Q1">Q1</SelectItem>
              <SelectItem value="Q2">Q2</SelectItem>
              <SelectItem value="Q3">Q3</SelectItem>
              <SelectItem value="Q4">Q4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Tax Collected"
              value={formatCurrency(taxData?.total_tax_collected)}
              change={`${year}${quarter !== 'all' ? ` ${quarter}` : ''}`}
              trend={
                (taxData?.total_tax_collected ?? 0) > 0 ? 'up' : 'neutral'
              }
              icon={
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              }
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label="Total Revenue"
              value={formatCurrency(taxData?.total_revenue)}
              change={`${year}${quarter !== 'all' ? ` ${quarter}` : ''}`}
              trend={
                (taxData?.total_revenue ?? 0) > 0 ? 'up' : 'neutral'
              }
              icon={
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              }
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label="Effective Tax Rate"
              value={formatPercent(taxData?.effective_tax_rate)}
              change="Weighted average"
              trend="neutral"
              icon={
                <Percent className="h-5 w-5 text-muted-foreground" />
              }
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label="Invoices Processed"
              value={formatNumber(taxData?.invoice_count)}
              change={`${year}${quarter !== 'all' ? ` ${quarter}` : ''}`}
              trend="neutral"
              icon={
                <FileText className="h-5 w-5 text-muted-foreground" />
              }
              moduleColor={MODULE_COLOR}
            />
          </>
        )}
      </div>

      {/* Chart and Quarterly Table */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quarterly Tax Chart */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quarterly Tax Chart</CardTitle>
              <CardDescription>
                Tax collected per quarter in {year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quarterlyData.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No quarterly data available
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={quarterlyData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="quarter"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickFormatter={(v: number) =>
                        `$${(v / 1000).toFixed(v >= 1000 ? 0 : 1)}k`
                      }
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => [
                        formatCurrency(value ?? 0),
                        'Tax Collected',
                      ]}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--popover))',
                        color: 'hsl(var(--popover-foreground))',
                      }}
                    />
                    <Bar
                      dataKey="tax_collected"
                      fill={MODULE_COLOR}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quarterly Breakdown Table */}
        {isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quarterly Breakdown</CardTitle>
              <CardDescription>
                Tax and revenue by quarter for {year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quarterlyData.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No quarterly data available
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Quarter</th>
                        <th className="px-4 py-3 font-medium text-right">
                          Tax Collected
                        </th>
                        <th className="px-4 py-3 font-medium text-right">
                          Revenue
                        </th>
                        <th className="px-4 py-3 font-medium text-right">
                          Invoices
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {quarterlyData.map((q: any) => (
                        <tr
                          key={q.quarter}
                          className="border-b last:border-0 transition-colors hover:bg-muted/50"
                        >
                          <td className="px-4 py-3 text-sm font-medium">
                            {q.quarter}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {formatCurrency(q.tax_collected)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {formatCurrency(q.revenue)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {formatNumber(q.invoice_count)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-muted/30 font-semibold">
                        <td className="px-4 py-3 text-sm">Total</td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatCurrency(quarterlyTotals.tax_collected)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatCurrency(quarterlyTotals.revenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatNumber(quarterlyTotals.invoice_count)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tax by Rate Table */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tax by Rate</CardTitle>
            <CardDescription>
              Breakdown of tax collected grouped by tax rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            {byRateData.length === 0 ? (
              <div className="flex py-12 items-center justify-center">
                <div className="text-center">
                  <Calculator className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No tax rate data available for the selected period
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Tax Rate</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Invoices
                      </th>
                      <th className="px-4 py-3 font-medium text-right">
                        Taxable Amount
                      </th>
                      <th className="px-4 py-3 font-medium text-right">
                        Tax Collected
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {byRateData.map((rate: any) => (
                      <tr
                        key={rate.tax_rate}
                        className="border-b last:border-0 transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 text-sm font-medium">
                          {rate.tax_rate}%
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatNumber(rate.invoice_count)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatCurrency(rate.taxable_amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatCurrency(rate.tax_collected)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
