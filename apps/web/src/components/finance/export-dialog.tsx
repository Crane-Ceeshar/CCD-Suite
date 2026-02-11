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
  CcdSpinner,
  toast,
} from '@ccd/ui';
import { Download } from 'lucide-react';
import { useExportFinance } from '@/hooks/use-finance';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type ExportType = 'invoices' | 'expenses' | 'payments';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: ExportType;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const EXPORT_TYPES: { value: ExportType; label: string }[] = [
  { value: 'invoices', label: 'Invoices' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'payments', label: 'Payments' },
];

const STATUS_OPTIONS: Record<ExportType, { value: string; label: string }[]> = {
  invoices: [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  expenses: [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'reimbursed', label: 'Reimbursed' },
  ],
  payments: [
    { value: '', label: 'All Statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ExportDialog({ open, onOpenChange, defaultType = 'invoices' }: ExportDialogProps) {
  const [type, setType] = React.useState<ExportType>(defaultType);
  const [status, setStatus] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');

  const exportFinance = useExportFinance();

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setType(defaultType);
      setStatus('');
      setFrom('');
      setTo('');
    }
  }, [open, defaultType]);

  // Reset status when type changes (statuses differ per type)
  React.useEffect(() => {
    setStatus('');
  }, [type]);

  function handleExport() {
    exportFinance.mutate(
      {
        type,
        ...(status ? { status } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        format: 'csv' as const,
      },
      {
        onSuccess: () => {
          toast({ title: 'Success', description: `${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully` });
          onOpenChange(false);
        },
        onError: (err: Error) => {
          toast({ title: 'Error', description: err.message || 'Export failed', variant: 'destructive' });
        },
      },
    );
  }

  const statusOptions = STATUS_OPTIONS[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Export your finance data as a CSV file. Choose the type, filters, and date range.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Export type */}
          <div className="space-y-2">
            <Label htmlFor="export-type">Data Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ExportType)}>
              <SelectTrigger id="export-type" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_TYPES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status filter */}
          <div className="space-y-2">
            <Label htmlFor="export-status">Status Filter</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="export-status" className="w-full">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="export-from">From</Label>
              <Input
                id="export-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-to">To</Label>
              <Input
                id="export-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          {/* Format (CSV only) */}
          <div className="space-y-2">
            <Label htmlFor="export-format">Format</Label>
            <Select value="csv" disabled>
              <SelectTrigger id="export-format" className="w-full">
                <SelectValue placeholder="CSV" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exportFinance.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exportFinance.isPending}>
            {exportFinance.isPending ? (
              <CcdSpinner size="sm" className="mr-2" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {exportFinance.isPending ? 'Exporting...' : 'Export CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
