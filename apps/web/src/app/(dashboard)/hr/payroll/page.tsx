'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@ccd/ui';
import { Plus, Wallet } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  processing: { label: 'Processing', variant: 'outline' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export default function PayrollPage() {
  const [payrollRuns] = useState<any[]>([]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Run payroll and view payment history"
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Payroll Run
        </Button>
      </PageHeader>

      {payrollRuns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No payroll runs</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first payroll run to process employee payments
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Run Payroll
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payrollRuns.map((run) => {
            const config = statusConfig[run.status];
            return (
              <Card key={run.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {new Date(run.period_start).toLocaleDateString()} – {new Date(run.period_end).toLocaleDateString()}
                    </CardTitle>
                  </div>
                  <Badge variant={config?.variant}>{config?.label}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Gross</p>
                      <p className="font-semibold">{formatCurrency(run.total_gross)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deductions</p>
                      <p className="font-semibold text-red-600">-{formatCurrency(run.total_deductions)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Net</p>
                      <p className="font-semibold text-green-600">{formatCurrency(run.total_net)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
