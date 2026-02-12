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
import { Star } from 'lucide-react';
import { useCreateReview, useEmployees } from '@/hooks/use-hr';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId?: string;
}

export function ReviewDialog({ open, onOpenChange, employeeId }: ReviewDialogProps) {
  const [form, setForm] = React.useState({
    employee_id: employeeId ?? '',
    reviewer_id: '',
    review_period: '',
    review_date: new Date().toISOString().split('T')[0],
    rating: 0,
    strengths: '',
    areas_for_improvement: '',
    goals: '',
    overall_comments: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const createReview = useCreateReview();
  const { data: employeesRes } = useEmployees({ status: 'active', limit: 100 });
  const employees = (employeesRes?.data as Array<{ id: string; first_name: string; last_name: string }>) ?? [];

  React.useEffect(() => {
    if (open) {
      setForm({
        employee_id: employeeId ?? '',
        reviewer_id: '',
        review_period: '',
        review_date: new Date().toISOString().split('T')[0],
        rating: 0,
        strengths: '',
        areas_for_improvement: '',
        goals: '',
        overall_comments: '',
      });
      setErrors({});
    }
  }, [open, employeeId]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.employee_id) errs.employee_id = 'Employee is required';
    if (!form.review_period) errs.review_period = 'Review period is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await createReview.mutateAsync({
        employee_id: form.employee_id,
        reviewer_id: form.reviewer_id || undefined,
        review_period: form.review_period,
        review_date: form.review_date,
        rating: form.rating > 0 ? form.rating : undefined,
        strengths: form.strengths || undefined,
        areas_for_improvement: form.areas_for_improvement || undefined,
        goals: form.goals || undefined,
        overall_comments: form.overall_comments || undefined,
      });
      onOpenChange(false);
    } catch {
      // Error handled by React Query
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Performance Review</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4">
          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label>Reviewer</Label>
              <Select
                value={form.reviewer_id}
                onValueChange={(v) => setForm((p) => ({ ...p, reviewer_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reviewer" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Review Period *</Label>
              <Input
                placeholder="e.g. Q1 2026, 2025 Annual"
                value={form.review_period}
                onChange={(e) => setForm((p) => ({ ...p, review_period: e.target.value }))}
              />
              {errors.review_period && (
                <p className="text-sm text-destructive">{errors.review_period}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Review Date</Label>
              <Input
                type="date"
                value={form.review_date}
                onChange={(e) => setForm((p) => ({ ...p, review_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, rating: p.rating === n ? 0 : n }))}
                  className="rounded p-0.5 transition-colors hover:bg-muted"
                >
                  <Star
                    className={`h-6 w-6 ${
                      n <= form.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
              {form.rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">{form.rating}/5</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Strengths</Label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Key strengths and accomplishments"
              value={form.strengths}
              onChange={(e) => setForm((p) => ({ ...p, strengths: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Areas for Improvement</Label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Areas that need development"
              value={form.areas_for_improvement}
              onChange={(e) => setForm((p) => ({ ...p, areas_for_improvement: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Goals</Label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Goals for the next review period"
              value={form.goals}
              onChange={(e) => setForm((p) => ({ ...p, goals: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Overall Comments</Label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Summary and overall assessment"
              value={form.overall_comments}
              onChange={(e) => setForm((p) => ({ ...p, overall_comments: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createReview.isPending}>
            {createReview.isPending && <CcdSpinner className="mr-2 h-4 w-4" />}
            Create Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
