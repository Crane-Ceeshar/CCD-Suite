'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
  Label,
  Textarea,
  CcdSpinner,
  toast,
} from '@ccd/ui';
import { Check, X, ExternalLink } from 'lucide-react';
import { useApproveExpense } from '@/hooks/use-finance';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ExpenseForApproval {
  id: string;
  description: string;
  category: string;
  vendor: string | null;
  amount: number;
  currency: string;
  expense_date: string;
  receipt_url: string | null;
  notes: string | null;
}

interface ExpenseApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: ExpenseForApproval | null;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const categoryLabels: Record<string, string> = {
  travel: 'Travel',
  software: 'Software',
  office: 'Office',
  marketing: 'Marketing',
  utilities: 'Utilities',
  payroll: 'Payroll',
  other: 'Other',
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ExpenseApprovalDialog({
  open,
  onOpenChange,
  expense,
}: ExpenseApprovalDialogProps) {
  const [approvalNotes, setApprovalNotes] = React.useState('');
  const approveExpense = useApproveExpense();

  // Reset notes when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setApprovalNotes('');
    }
  }, [open]);

  if (!expense) return null;

  function handleAction(action: 'approve' | 'reject') {
    if (!expense) return;

    approveExpense.mutate(
      {
        id: expense.id,
        action,
        notes: approvalNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: action === 'approve' ? 'Expense approved' : 'Expense rejected',
            description: action === 'approve' ? 'Expense has been approved' : 'Expense has been rejected',
          });
          onOpenChange(false);
        },
        onError: (err: Error) => {
          toast({ title: 'Error', description: err.message || `Failed to ${action} expense`, variant: 'destructive' });
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Review Expense</DialogTitle>
          <DialogDescription>
            Review the expense details and approve or reject it.
          </DialogDescription>
        </DialogHeader>

        {/* Expense details */}
        <div className="space-y-4">
          {/* Amount badge */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
            <span className="text-sm font-medium text-muted-foreground">Amount</span>
            <span className="text-2xl font-bold">
              {formatCurrency(expense.amount, expense.currency)}
            </span>
          </div>

          {/* Detail rows */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">Description</span>
              <span className="text-sm text-right">{expense.description}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">Category</span>
              <Badge variant="secondary">
                {categoryLabels[expense.category] || expense.category}
              </Badge>
            </div>

            {expense.vendor && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-muted-foreground">Vendor</span>
                <span className="text-sm">{expense.vendor}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">Date</span>
              <span className="text-sm">{formatDate(expense.expense_date)}</span>
            </div>

            {expense.notes && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm font-medium text-muted-foreground">Notes</span>
                <span className="text-sm text-right max-w-[260px]">{expense.notes}</span>
              </div>
            )}

            {expense.receipt_url && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-muted-foreground">Receipt</span>
                <a
                  href={expense.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View Receipt
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Approval notes */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="approval-notes">Approval / Rejection Notes</Label>
            <Textarea
              id="approval-notes"
              rows={3}
              placeholder="Optional notes for this decision..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              disabled={approveExpense.isPending}
            />
          </div>
        </div>

        {/* Action buttons */}
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={approveExpense.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => handleAction('reject')}
            disabled={approveExpense.isPending}
          >
            {approveExpense.isPending ? (
              <CcdSpinner size="sm" className="mr-2" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            Reject
          </Button>
          <Button
            type="button"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleAction('approve')}
            disabled={approveExpense.isPending}
          >
            {approveExpense.isPending ? (
              <CcdSpinner size="sm" className="mr-2" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
