'use client';

import Link from 'next/link';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Button, CcdLoader, toast } from '@ccd/ui';
import { ArrowLeft, Play, CheckCircle, XCircle } from 'lucide-react';
import { usePayrollRun, useProcessPayroll } from '@/hooks/use-hr';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  processing: { label: 'Processing', variant: 'outline' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function PayrollRunDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const { data: runRes, isLoading, error } = usePayrollRun(id);
  const processPayroll = useProcessPayroll(id);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <CcdLoader size="lg" />
      </div>
    );
  }

  // Error / 404 state
  if (error || !runRes?.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payroll Run Not Found" description="The requested payroll run could not be loaded.">
          <Link href="/hr/payroll">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payroll
            </Button>
          </Link>
        </PageHeader>
      </div>
    );
  }

  const run = runRes.data as {
    id: string;
    period_start: string;
    period_end: string;
    status: string;
    currency: string;
    total_gross: number;
    total_deductions: number;
    total_net: number;
    processed_by: string | null;
    processed_at: string | null;
    created_at: string;
    items?: {
      id: string;
      employee_id: string;
      gross_amount: number;
      deductions: number;
      net_amount: number;
      employee?: {
        id: string;
        first_name: string;
        last_name: string;
        job_title: string | null;
      };
    }[];
  };

  const currency = run.currency ?? 'USD';
  const config = statusConfig[run.status] ?? statusConfig.draft;
  const items = run.items ?? [];

  const handleProcess = async () => {
    if (!window.confirm('Are you sure you want to process this payroll run? This will calculate pay for all included employees.')) return;
    try {
      await processPayroll.mutateAsync({ action: 'process' });
      toast({ title: 'Success', description: 'Payroll processing started' });
    } catch {
      toast({ title: 'Error', description: 'Failed to process payroll', variant: 'destructive' });
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Are you sure you want to mark this payroll run as completed?')) return;
    try {
      await processPayroll.mutateAsync({ action: 'complete' });
      toast({ title: 'Success', description: 'Payroll run completed' });
    } catch {
      toast({ title: 'Error', description: 'Failed to complete payroll', variant: 'destructive' });
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this payroll run? This action cannot be undone.')) return;
    try {
      await processPayroll.mutateAsync({ action: 'cancel' });
      toast({ title: 'Success', description: 'Payroll run cancelled' });
    } catch {
      toast({ title: 'Error', description: 'Failed to cancel payroll', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Run Details"
        description={`${formatDate(run.period_start)} \u2013 ${formatDate(run.period_end)}`}
      >
        <div className="flex gap-2">
          <Link href="/hr/payroll">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>

          {/* Draft actions */}
          {run.status === 'draft' && (
            <Button size="sm" onClick={handleProcess} disabled={processPayroll.isPending}>
              <Play className="mr-2 h-4 w-4" />
              {processPayroll.isPending ? 'Processing...' : 'Process Payroll'}
            </Button>
          )}

          {/* Processing actions */}
          {run.status === 'processing' && (
            <>
              <Button size="sm" onClick={handleComplete} disabled={processPayroll.isPending}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete
              </Button>
              <Button variant="destructive" size="sm" onClick={handleCancel} disabled={processPayroll.isPending}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          )}

          {/* Completed indicator */}
          {run.status === 'completed' && (
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium px-3">
              <CheckCircle className="h-4 w-4" />
              Completed
            </div>
          )}

          {/* Cancelled indicator */}
          {run.status === 'cancelled' && (
            <div className="flex items-center gap-2 text-sm text-red-600 font-medium px-3">
              <XCircle className="h-4 w-4" />
              Cancelled
            </div>
          )}
        </div>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-1">
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Gross</p>
            <p className="text-2xl font-bold">{formatCurrency(run.total_gross ?? 0, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Deductions</p>
            <p className="text-2xl font-bold text-red-600">-{formatCurrency(run.total_deductions ?? 0, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Net</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(run.total_net ?? 0, currency)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Run metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Period Start</p>
              <p className="font-medium">{formatDate(run.period_start)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Period End</p>
              <p className="font-medium">{formatDate(run.period_end)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Currency</p>
              <p className="font-medium">{currency}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(run.created_at)}</p>
            </div>
            {run.processed_by && (
              <div>
                <p className="text-muted-foreground">Processed By</p>
                <p className="font-medium">{run.processed_by}</p>
              </div>
            )}
            {run.processed_at && (
              <div>
                <p className="text-muted-foreground">Processed At</p>
                <p className="font-medium">{formatDate(run.processed_at)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payroll Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payroll Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">Employee</th>
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">Job Title</th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground">Gross</th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground">Deductions</th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3 text-sm font-medium">
                        {item.employee
                          ? `${item.employee.first_name} ${item.employee.last_name}`
                          : 'Unknown Employee'}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {item.employee?.job_title ?? '\u2014'}
                      </td>
                      <td className="py-3 text-sm text-right">
                        {formatCurrency(item.gross_amount ?? 0, currency)}
                      </td>
                      <td className="py-3 text-sm text-right text-red-600">
                        -{formatCurrency(item.deductions ?? 0, currency)}
                      </td>
                      <td className="py-3 text-sm text-right font-medium text-green-600">
                        {formatCurrency(item.net_amount ?? 0, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2">
                    <td colSpan={2} className="py-3 text-sm font-bold">Totals</td>
                    <td className="py-3 text-sm text-right font-bold">
                      {formatCurrency(run.total_gross ?? 0, currency)}
                    </td>
                    <td className="py-3 text-sm text-right font-bold text-red-600">
                      -{formatCurrency(run.total_deductions ?? 0, currency)}
                    </td>
                    <td className="py-3 text-sm text-right font-bold text-green-600">
                      {formatCurrency(run.total_net ?? 0, currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No payroll items in this run
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
