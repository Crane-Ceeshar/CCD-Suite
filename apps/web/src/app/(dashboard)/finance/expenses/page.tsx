'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge, Button, CcdSpinner, SearchInput } from '@ccd/ui';
import { Plus, Receipt, Check, X, Pencil } from 'lucide-react';
import { useExpenses, useDeleteExpense } from '@/hooks/use-finance';
import { ExpenseDialog } from '@/components/finance/expense-dialog';
import { ExpenseApprovalDialog } from '@/components/finance/expense-approval-dialog';

// ── Expense type matching API response ──

interface Expense {
  id: string;
  description: string;
  category: string;
  vendor: string | null;
  amount: number;
  currency: string;
  expense_date: string;
  status: string;
  receipt_url: string | null;
  notes: string | null;
}

// ── Label / config maps ──

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

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'travel', label: 'Travel' },
  { value: 'software', label: 'Software' },
  { value: 'office', label: 'Office' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'other', label: 'Other' },
];

// ── Helpers ──

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Page component ──

export default function ExpensesPage() {
  const [filter, setFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Dialog states
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [approvingExpense, setApprovingExpense] = useState<Expense | null>(null);

  // Build filters for the API query
  const queryFilters = {
    ...(filter !== 'all' ? { status: filter } : {}),
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(search ? { search } : {}),
  };

  const { data: raw, isLoading } = useExpenses(queryFilters);
  const deleteExpense = useDeleteExpense();

  const expenses: Expense[] = (raw as { data?: Expense[] } | undefined)?.data ?? [];

  // ── Open create dialog ──
  function handleAddExpense() {
    setEditingExpense(null);
    setShowExpenseDialog(true);
  }

  // ── Open edit dialog ──
  function handleEditExpense(expense: Expense) {
    setEditingExpense(expense);
    setShowExpenseDialog(true);
  }

  // ── Open approval dialog ──
  function handleOpenApproval(expense: Expense) {
    setApprovingExpense(expense);
  }

  // ── Close expense dialog ──
  function handleExpenseDialogChange(open: boolean) {
    setShowExpenseDialog(open);
    if (!open) {
      setEditingExpense(null);
    }
  }

  // ── Close approval dialog ──
  function handleApprovalDialogChange(open: boolean) {
    if (!open) {
      setApprovingExpense(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and manage business expenses"
      >
        <Button onClick={handleAddExpense}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </PageHeader>

      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          placeholder="Search expenses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          className="sm:w-72"
        />
        <div className="flex gap-2">
          {categoryOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={categoryFilter === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

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

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <CcdSpinner size="lg" />
        </div>
      ) : expenses.length === 0 ? (
        /* Empty state */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No expenses found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || filter !== 'all' || categoryFilter
                ? 'Try adjusting your filters or search query'
                : 'Start tracking your business expenses'}
            </p>
            <Button onClick={handleAddExpense}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Expense list */
        <div className="space-y-2">
          {/* Table header */}
          <div className="hidden md:grid md:grid-cols-[100px_1fr_120px_1fr_100px_120px_140px] gap-4 px-6 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Date</span>
            <span>Vendor</span>
            <span>Category</span>
            <span>Description</span>
            <span className="text-right">Amount</span>
            <span className="text-center">Status</span>
            <span className="text-center">Actions</span>
          </div>

          {expenses.map((expense) => {
            const config = statusConfig[expense.status];
            return (
              <Card key={expense.id} className="transition-shadow hover:shadow-md">
                <CardContent className="py-4">
                  {/* Desktop row */}
                  <div className="hidden md:grid md:grid-cols-[100px_1fr_120px_1fr_100px_120px_140px] gap-4 items-center">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(expense.expense_date)}
                    </span>
                    <span className="text-sm font-medium truncate">
                      {expense.vendor || 'No vendor'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {categoryLabels[expense.category] || expense.category}
                    </span>
                    <span className="text-sm truncate">{expense.description}</span>
                    <span className="text-sm font-semibold text-right">
                      {formatCurrency(expense.amount, expense.currency || 'USD')}
                    </span>
                    <div className="flex justify-center">
                      <Badge variant={config?.variant}>{config?.label}</Badge>
                    </div>
                    <div className="flex justify-center gap-1">
                      {/* Edit button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => handleEditExpense(expense)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* Approve / Reject buttons for pending expenses */}
                      {expense.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleOpenApproval(expense)}
                            title="Approve / Reject"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Mobile layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{expense.description}</p>
                      <Badge variant={config?.variant}>{config?.label}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{categoryLabels[expense.category] || expense.category}</span>
                      <span>·</span>
                      <span>{expense.vendor || 'No vendor'}</span>
                      <span>·</span>
                      <span>{formatDate(expense.expense_date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">
                        {formatCurrency(expense.amount, expense.currency || 'USD')}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => handleEditExpense(expense)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {expense.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleOpenApproval(expense)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Expense create/edit dialog */}
      <ExpenseDialog
        open={showExpenseDialog}
        onOpenChange={handleExpenseDialogChange}
        expense={editingExpense}
      />

      {/* Expense approval dialog */}
      <ExpenseApprovalDialog
        open={!!approvingExpense}
        onOpenChange={handleApprovalDialogChange}
        expense={approvingExpense}
      />
    </div>
  );
}
