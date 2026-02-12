'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CcdSpinner,
} from '@ccd/ui';
import { useCreateLeaveRequest, useEmployees, useLeaveBalances } from '@/hooks/use-hr';

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId?: string; // pre-selected employee
}

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'personal', label: 'Personal Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
];

function calculateBusinessDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function LeaveRequestDialog({
  open,
  onOpenChange,
  employeeId,
}: LeaveRequestDialogProps) {
  const [form, setForm] = React.useState({
    employee_id: employeeId ?? '',
    type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const createLeave = useCreateLeaveRequest();
  const { data: employeesRes } = useEmployees({ status: 'active', limit: 100 });
  const employees = (employeesRes?.data as Array<{ id: string; first_name: string; last_name: string }>) ?? [];

  const { data: balancesRes } = useLeaveBalances(form.employee_id || null);
  const balances = (balancesRes?.data as Array<{ leave_type: string; remaining_days: number }>) ?? [];
  const selectedBalance = balances.find((b) => b.leave_type === form.type);

  const daysCount = calculateBusinessDays(form.start_date, form.end_date);

  React.useEffect(() => {
    if (open) {
      setForm({
        employee_id: employeeId ?? '',
        type: 'annual',
        start_date: '',
        end_date: '',
        reason: '',
      });
      setErrors({});
    }
  }, [open, employeeId]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.employee_id) errs.employee_id = 'Employee is required';
    if (!form.start_date) errs.start_date = 'Start date is required';
    if (!form.end_date) errs.end_date = 'End date is required';
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      errs.end_date = 'End date must be after start date';
    }
    if (daysCount <= 0 && form.start_date && form.end_date) {
      errs.start_date = 'Selected range has no business days';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await createLeave.mutateAsync({
        employee_id: form.employee_id,
        type: form.type,
        start_date: form.start_date,
        end_date: form.end_date,
        days_count: daysCount,
        reason: form.reason || undefined,
      });
      onOpenChange(false);
    } catch {
      // Error handled by React Query
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Leave Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!employeeId && (
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select
                value={form.employee_id}
                onValueChange={(v) => setForm((p) => ({ ...p, employee_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employee_id && (
                <p className="text-sm text-destructive">{errors.employee_id}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Leave Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((lt) => (
                  <SelectItem key={lt.value} value={lt.value}>
                    {lt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBalance && (
              <p className="text-xs text-muted-foreground">
                {selectedBalance.remaining_days} days remaining
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
              />
              {errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date}</p>
              )}
            </div>
          </div>

          {daysCount > 0 && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <strong>{daysCount}</strong> business day{daysCount !== 1 ? 's' : ''} requested
              {selectedBalance && daysCount > selectedBalance.remaining_days && (
                <p className="mt-1 text-destructive">
                  Exceeds remaining balance ({selectedBalance.remaining_days} days)
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Reason for leave (optional)"
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createLeave.isPending}
          >
            {createLeave.isPending && <CcdSpinner className="mr-2 h-4 w-4" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
