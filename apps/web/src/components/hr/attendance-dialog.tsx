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
import { useCreateAttendance, useEmployees } from '@/hooks/use-hr';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'half_day', label: 'Half Day' },
] as const;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function emptyForm() {
  return {
    employee_id: '',
    date: todayISO(),
    clock_in: '',
    clock_out: '',
    status: 'present',
    notes: '',
  };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function AttendanceDialog({ open, onOpenChange }: AttendanceDialogProps) {
  // ── Form state ──
  const [form, setForm] = React.useState(emptyForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // ── Data queries ──
  const { data: employeesData } = useEmployees({ status: 'active', limit: 100 });
  const employees: { id: string; first_name: string; last_name: string }[] =
    (employeesData as any)?.data ?? [];

  // ── Mutations ──
  const createAttendance = useCreateAttendance();
  const isPending = createAttendance.isPending;

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
    if (!form.employee_id) {
      newErrors.employee_id = 'Employee is required';
    }
    if (!form.date) {
      newErrors.date = 'Date is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      employee_id: form.employee_id,
      date: form.date,
      clock_in: form.clock_in || null,
      clock_out: form.clock_out || null,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    createAttendance.mutate(payload as Record<string, unknown>, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Attendance recorded',
        });
        onOpenChange(false);
      },
      onError: (err: Error) => {
        toast({
          title: 'Error',
          description: err.message || 'Failed to record attendance',
          variant: 'destructive',
        });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Record Attendance</DialogTitle>
          <DialogDescription>
            Fill in the details to record a new attendance entry.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee */}
          <div className="space-y-2">
            <Label htmlFor="att-employee">
              Employee <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.employee_id}
              onValueChange={(v) => updateField('employee_id', v)}
            >
              <SelectTrigger id="att-employee" className="w-full">
                <SelectValue placeholder="Select an employee..." />
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
              <p className="text-xs text-destructive">{errors.employee_id}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="att-date">
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="att-date"
              type="date"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
            />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date}</p>
            )}
          </div>

          {/* Clock In + Clock Out */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="att-clock-in">Clock In</Label>
              <Input
                id="att-clock-in"
                type="time"
                value={form.clock_in}
                onChange={(e) => updateField('clock_in', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="att-clock-out">Clock Out</Label>
              <Input
                id="att-clock-out"
                type="time"
                value={form.clock_out}
                onChange={(e) => updateField('clock_out', e.target.value)}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="att-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => updateField('status', v)}
            >
              <SelectTrigger id="att-status" className="w-full">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="att-notes">Notes</Label>
            <Textarea
              id="att-notes"
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
              Record Attendance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
