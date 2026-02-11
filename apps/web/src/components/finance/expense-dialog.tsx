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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  CcdSpinner,
  toast,
} from '@ccd/ui';
import { useCreateExpense, useUpdateExpense } from '@/hooks/use-finance';
import { apiGet } from '@/lib/api';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ExpenseFormData {
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

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: ExpenseFormData | null;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const CATEGORY_OPTIONS = [
  { value: 'travel', label: 'Travel' },
  { value: 'software', label: 'Software' },
  { value: 'office', label: 'Office' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'other', label: 'Other' },
] as const;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function emptyForm() {
  return {
    description: '',
    category: 'other',
    vendor: '',
    amount: '',
    currency: 'USD',
    expense_date: todayISO(),
    receipt_url: '',
    notes: '',
  };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ExpenseDialog({ open, onOpenChange, expense }: ExpenseDialogProps) {
  const isEditMode = !!expense;

  // ── Form state ──
  const [form, setForm] = React.useState(emptyForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // ── Mutations ──
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense(expense?.id ?? '');

  const isPending = createExpense.isPending || updateExpense.isPending;

  // ── Reset form when dialog opens/closes or expense changes ──
  React.useEffect(() => {
    if (open) {
      if (expense) {
        setForm({
          description: expense.description ?? '',
          category: expense.category ?? 'other',
          vendor: expense.vendor ?? '',
          amount: String(expense.amount ?? ''),
          currency: expense.currency ?? 'USD',
          expense_date: expense.expense_date
            ? expense.expense_date.split('T')[0]
            : todayISO(),
          receipt_url: expense.receipt_url ?? '',
          notes: expense.notes ?? '',
        });
      } else {
        // Fetch default currency from finance settings for new expenses
        const defaults = emptyForm();
        apiGet<{ defaultCurrency?: string }>('/api/settings/module?module=finance&key=currency.preferences')
          .then((res) => {
            const data = res.data as { defaultCurrency?: string } | null;
            if (data?.defaultCurrency) {
              defaults.currency = data.defaultCurrency;
            }
            setForm(defaults);
          })
          .catch(() => {
            setForm(defaults);
          });
      }
      setErrors({});
    }
  }, [open, expense]);

  // ── Field updater ──
  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  // ── Validation ──
  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.description.trim()) {
      newErrors.description = 'Description is required';
    }
    const parsedAmount = parseFloat(form.amount);
    if (!form.amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'A valid amount is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      description: form.description.trim(),
      category: form.category,
      vendor: form.vendor.trim() || null,
      amount: parseFloat(form.amount),
      currency: form.currency || 'USD',
      expense_date: form.expense_date || todayISO(),
      receipt_url: form.receipt_url?.trim() || null,
      notes: form.notes?.trim() || null,
    };

    const mutation = isEditMode ? updateExpense : createExpense;

    mutation.mutate(payload as Record<string, unknown>, {
      onSuccess: () => {
        toast({ title: 'Success', description: isEditMode ? 'Expense updated' : 'Expense created' });
        onOpenChange(false);
      },
      onError: (err: Error) => {
        toast({ title: 'Error', description: err.message || 'Failed to save expense', variant: 'destructive' });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the details for this expense.'
              : 'Fill in the details to record a new expense.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="expense-description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="expense-description"
              placeholder="e.g. Team lunch, SaaS subscription..."
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Category + Vendor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense-category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => updateField('category', v)}
              >
                <SelectTrigger id="expense-category" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-vendor">Vendor</Label>
              <Input
                id="expense-vendor"
                placeholder="e.g. Amazon, Uber..."
                value={form.vendor}
                onChange={(e) => updateField('vendor', e.target.value)}
              />
            </div>
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense-amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="expense-amount"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-currency">Currency</Label>
              <Input
                id="expense-currency"
                placeholder="USD"
                value={form.currency}
                onChange={(e) => updateField('currency', e.target.value)}
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="expense-date">Expense Date</Label>
            <Input
              id="expense-date"
              type="date"
              value={form.expense_date}
              onChange={(e) => updateField('expense_date', e.target.value)}
            />
          </div>

          {/* Receipt URL */}
          <div className="space-y-2">
            <Label htmlFor="expense-receipt-url">Receipt URL</Label>
            <Input
              id="expense-receipt-url"
              placeholder="https://..."
              value={form.receipt_url}
              onChange={(e) => updateField('receipt_url', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="expense-notes">Notes</Label>
            <Textarea
              id="expense-notes"
              rows={3}
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <CcdSpinner size="sm" className="mr-2" />}
              {isEditMode ? 'Update Expense' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
