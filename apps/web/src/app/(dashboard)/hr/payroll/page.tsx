'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Button, Skeleton } from '@ccd/ui';
import { Plus, Wallet, Download } from 'lucide-react';
import Link from 'next/link';
import { usePayrollRuns, useExportHr } from '@/hooks/use-hr';
import { PayrollRunDialog } from '@/components/hr/payroll-run-dialog';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  processing: { label: 'Processing', variant: 'outline' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

function PayrollCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PayrollPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const exportHr = useExportHr();

  const { data: response, isLoading } = usePayrollRuns({
    status: statusFilter === 'all' ? '' : statusFilter,
  });
  const payrollRuns = (response?.data as any[]) ?? [];

  const handleExport = () => {
    exportHr.mutate({
      type: 'payroll',
      status: statusFilter === 'all' ? undefined : statusFilter,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Run payroll and view payment history"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exportHr.isPending}>
            <Download className="mr-2 h-4 w-4" />
            {exportHr.isPending ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Payroll Run
          </Button>
        </div>
      </PageHeader>

      {/* Status filter */}
      <div className="flex gap-2">
        {['all', 'draft', 'processing', 'completed', 'cancelled'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status === 'all' ? 'All' : statusConfig[status]?.label ?? status}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <PayrollCardSkeleton />
          <PayrollCardSkeleton />
          <PayrollCardSkeleton />
        </div>
      ) : !payrollRuns.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No payroll runs</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first payroll run to process employee payments
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Run Payroll
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payrollRuns.map((run: any) => {
            const config = statusConfig[run.status];
            return (
              <Link key={run.id} href={`/hr/payroll/${run.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {new Date(run.period_start).toLocaleDateString()} -- {new Date(run.period_end).toLocaleDateString()}
                      </CardTitle>
                    </div>
                    <Badge variant={config?.variant}>{config?.label}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Gross</p>
                        <p className="font-semibold">{formatCurrency(run.total_gross ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Deductions</p>
                        <p className="font-semibold text-red-600">-{formatCurrency(run.total_deductions ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Net</p>
                        <p className="font-semibold text-green-600">{formatCurrency(run.total_net ?? 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      <PayrollRunDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
