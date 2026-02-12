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
import {
  useCreateDepartment,
  useUpdateDepartment,
  useEmployees,
} from '@/hooks/use-hr';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: {
    id: string;
    name: string;
    description?: string | null;
    head_id?: string | null;
  } | null;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function emptyForm() {
  return {
    name: '',
    description: '',
    head_id: '',
  };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function DepartmentDialog({
  open,
  onOpenChange,
  department,
}: DepartmentDialogProps) {
  const isEditMode = !!department;

  // ── Form state ──
  const [form, setForm] = React.useState(emptyForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // ── Data queries ──
  const { data: employeesData } = useEmployees({ status: 'active', limit: 100 });
  const employees: { id: string; first_name: string; last_name: string }[] =
    (employeesData as any)?.data ?? [];

  // ── Mutations ──
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment(department?.id ?? '');

  const isPending = createDepartment.isPending || updateDepartment.isPending;

  // ── Reset form when dialog opens/closes or department changes ──
  React.useEffect(() => {
    if (open) {
      if (department) {
        setForm({
          name: department.name ?? '',
          description: department.description ?? '',
          head_id: department.head_id ?? '',
        });
      } else {
        setForm(emptyForm());
      }
      setErrors({});
    }
  }, [open, department]);

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
    if (!form.name.trim()) {
      newErrors.name = 'Department name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      head_id: form.head_id || null,
    };

    const mutation = isEditMode ? updateDepartment : createDepartment;

    mutation.mutate(payload as Record<string, unknown>, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: isEditMode ? 'Department updated' : 'Department created',
        });
        onOpenChange(false);
      },
      onError: (err: Error) => {
        toast({
          title: 'Error',
          description: err.message || 'Failed to save department',
          variant: 'destructive',
        });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Department' : 'New Department'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the details for this department.'
              : 'Fill in the details to create a new department.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="dept-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dept-name"
              placeholder="e.g. Engineering, Marketing..."
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="dept-description">Description</Label>
            <Textarea
              id="dept-description"
              rows={3}
              placeholder="Brief description of the department..."
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </div>

          {/* Head (Manager) */}
          <div className="space-y-2">
            <Label htmlFor="dept-head">Department Head</Label>
            <Select
              value={form.head_id}
              onValueChange={(v) => updateField('head_id', v)}
            >
              <SelectTrigger id="dept-head" className="w-full">
                <SelectValue placeholder="Select an employee..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {isEditMode ? 'Save Changes' : 'Create Department'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
