'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge, Button } from '@ccd/ui';
import { Plus, Receipt } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  travel: 'Travel',
  software: 'Software',
  office: 'Office',
  marketing: 'Marketing',
  utilities: 'Utilities',
  payroll: 'Payroll',
  other: 'Other',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  approved: { label: 'Approved', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  reimbursed: { label: 'Reimbursed', variant: 'outline' },
};

export default function ExpensesPage() {
  const [expenses] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const filteredExpenses = filter === 'all' ? expenses : expenses.filter(e => e.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and manage business expenses"
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </PageHeader>

      {/* Status filter */}
      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected', 'reimbursed'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : statusConfig[status]?.label}
          </Button>
        ))}
      </div>

      {/* Expense list */}
      {filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No expenses yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking your business expenses
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map((expense) => {
            const config = statusConfig[expense.status];
            return (
              <Card key={expense.id} className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{categoryLabels[expense.category] || expense.category}</span>
                      <span>·</span>
                      <span>{expense.vendor || 'No vendor'}</span>
                      <span>·</span>
                      <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={config?.variant}>{config?.label}</Badge>
                    <p className="font-semibold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: expense.currency || 'USD' }).format(expense.amount)}
                    </p>
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
