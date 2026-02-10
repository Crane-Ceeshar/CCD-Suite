'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CcdLoader,
  EmptyState,
} from '@ccd/ui';
import { GitBranch } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { DateRangePicker, type PeriodValue } from '@/components/shared/date-range-picker';
import { FunnelChart } from '@/components/analytics/funnel-chart';

interface FunnelStage {
  name: string;
  count: number;
  conversionRate: number;
  dropoffRate: number;
}

interface FunnelData {
  period: string;
  stages: FunnelStage[];
  total_deals: number;
  overall_conversion: number;
}

export default function FunnelPage() {
  const [period, setPeriod] = React.useState<PeriodValue>('30d');
  const [data, setData] = React.useState<FunnelData | null>(null);
  const [loading, setLoading] = React.useState(true);

  async function load(p: PeriodValue) {
    setLoading(true);
    try {
      const res = await apiGet<FunnelData>(`/api/analytics/funnel?period=${p}`);
      setData(res.data);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load(period);
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Funnel"
        description="CRM pipeline conversion analysis"
        breadcrumbs={[
          { label: 'Analytics', href: '/analytics' },
          { label: 'Funnel' },
        ]}
        actions={
          <DateRangePicker value={period} onChange={setPeriod} />
        }
      />

      {data && data.stages.length > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Total Deals</p>
                <p className="text-2xl font-bold">{data.total_deals}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Overall Conversion</p>
                <p className="text-2xl font-bold text-green-600">{data.overall_conversion}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Pipeline Stages</p>
                <p className="text-2xl font-bold">{data.stages.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Funnel Visualization */}
          <FunnelChart stages={data.stages} title="Deal Pipeline Funnel" />

          {/* Stage Details Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Stage Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground">Stage</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Count</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Conversion</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Drop-off</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stages.map((stage, i) => (
                      <tr key={stage.name} className="border-b last:border-0">
                        <td className="py-2 capitalize">{stage.name.replace(/_/g, ' ')}</td>
                        <td className="py-2 text-right">{stage.count}</td>
                        <td className="py-2 text-right">
                          {i === 0 ? '—' : (
                            <span className={stage.conversionRate >= 50 ? 'text-green-600' : stage.conversionRate >= 25 ? 'text-amber-600' : 'text-red-600'}>
                              {stage.conversionRate}%
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right text-muted-foreground">
                          {i === 0 ? '—' : `${stage.dropoffRate}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState
          icon={<GitBranch className="h-6 w-6 text-muted-foreground" />}
          title="No Funnel Data"
          description="Add deals to your CRM pipeline to see conversion analysis."
        />
      )}
    </div>
  );
}
