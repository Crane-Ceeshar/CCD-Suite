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
import { useCreatePayrollRun } from '@/hooks/use-hr';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface PayrollRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
] as const;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function emptyForm() {
  return {
    period_start: '',
    period_end: '',
    currency: 'USD',
    notes: '',
  };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function PayrollRunDialog({
  open,
  onOpenChange,
}: PayrollRunDialogProps) {
  // ── Form state ──
  const [form, setForm] = React.useState(emptyForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // ── Mutations ──
  const createPayrollRun = useCreatePayrollRun();
  const isPending = createPayrollRun.isPending;

  // ── Reset form when dialog opens ──
  React.useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setErrors({});
    }
  }, [open]);

  // ── Field updater ──
  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    if (!form.period_start) {
      newErrors.period_start = 'Period start date is required';
    }
    if (!form.period_end) {
      newErrors.period_end = 'Period end date is required';
    }
    if (
      form.period_start &&
      form.period_end &&
      form.period_start > form.period_end
    ) {
      newErrors.period_end = 'End date must be on or after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      period_start: form.period_start,
      period_end: form.period_end,
      currency: form.currency || 'USD',
      notes: form.notes.trim() || null,
    };

    createPayrollRun.mutate(payload as Record<string, unknown>, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Payroll run created',
        });
        onOpenChange(false);
      },
      onError: (err: Error) => {
        toast({
          title: 'Error',
          description: err.message || 'Failed to create payroll run',
          variant: 'destructive',
        });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Payroll Run</DialogTitle>
          <DialogDescription>
            Define the pay period and currency to create a new payroll run.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Period Start + Period End */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pr-period-start">
                Period Start <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pr-period-start"
                type="date"
                value={form.period_start}
                onChange={(e) => updateField('period_start', e.target.value)}
              />
              {errors.period_start && (
                <p className="text-xs text-destructive">
                  {errors.period_start}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pr-period-end">
                Period End <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pr-period-end"
                type="date"
                value={form.period_end}
                onChange={(e) => updateField('period_end', e.target.value)}
              />
              {errors.period_end && (
                <p className="text-xs text-destructive">
                  {errors.period_end}
                </p>
              )}
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="pr-currency">Currency</Label>
            <Select
              value={form.currency}
              onValueChange={(v) => updateField('currency', v)}
            >
              <SelectTrigger id="pr-currency" className="w-full">
                <SelectValue placeholder="Select currency..." />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="pr-notes">Notes</Label>
            <Textarea
              id="pr-notes"
              rows={3}
              placeholder="Any additional notes for this payroll run..."
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
              Create Payroll Run
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
