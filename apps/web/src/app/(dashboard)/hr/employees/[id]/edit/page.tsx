'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Button, Input, Label, CcdLoader, toast } from '@ccd/ui';
import { ArrowLeft } from 'lucide-react';
import { useEmployee, useUpdateEmployee, useDepartments, useEmployees } from '@/hooks/use-hr';

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function EditEmployeePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();

  const { data: employeeRes, isLoading: loadingEmployee } = useEmployee(id);
  const updateEmployee = useUpdateEmployee(id);
  const { data: departmentsRes } = useDepartments();
  const { data: employeesRes } = useEmployees({ status: 'active', limit: 100 });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    employment_type: 'full_time',
    hire_date: '',
    department_id: '',
    manager_id: '',
    salary: '',
    salary_currency: 'USD',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
  });

  const [populated, setPopulated] = useState(false);

  // Pre-populate form when employee data loads
  useEffect(() => {
    if (employeeRes?.data && !populated) {
      const emp = employeeRes.data as Record<string, unknown>;
      setFormData({
        first_name: (emp.first_name as string) ?? '',
        last_name: (emp.last_name as string) ?? '',
        email: (emp.email as string) ?? '',
        phone: (emp.phone as string) ?? '',
        job_title: (emp.job_title as string) ?? '',
        employment_type: (emp.employment_type as string) ?? 'full_time',
        hire_date: emp.hire_date ? (emp.hire_date as string).split('T')[0] : '',
        department_id: (emp.department_id as string) ?? '',
        manager_id: (emp.manager_id as string) ?? '',
        salary: emp.salary != null ? String(emp.salary) : '',
        salary_currency: (emp.salary_currency as string) ?? 'USD',
        address: (emp.address as string) ?? '',
        emergency_contact_name: (emp.emergency_contact_name as string) ?? '',
        emergency_contact_phone: (emp.emergency_contact_phone as string) ?? '',
        notes: (emp.notes as string) ?? '',
      });
      setPopulated(true);
    }
  }, [employeeRes, populated]);

  const update = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast({ title: 'Validation Error', description: 'First name and last name are required', variant: 'destructive' });
      return;
    }

    try {
      const payload: Record<string, unknown> = { ...formData };
      // Convert salary to number if provided
      if (payload.salary) {
        payload.salary = Number(payload.salary);
      } else {
        delete payload.salary;
      }
      // Remove empty optional fields
      if (!payload.department_id) delete payload.department_id;
      if (!payload.manager_id) delete payload.manager_id;

      await updateEmployee.mutateAsync(payload);
      toast({ title: 'Success', description: 'Employee updated successfully' });
      router.push(`/hr/employees/${id}`);
    } catch {
      toast({ title: 'Error', description: 'Failed to update employee', variant: 'destructive' });
    }
  };

  const departments = ((departmentsRes?.data ?? []) as { id: string; name: string }[]);
  const employees = ((employeesRes?.data ?? []) as { id: string; first_name: string; last_name: string }[])
    .filter(e => e.id !== id);

  const selectClassName = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  // Loading state
  if (loadingEmployee) {
    return (
      <div className="flex h-64 items-center justify-center">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Employee"
        description="Update employee information"
      >
        <Link href={`/hr/employees/${id}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </PageHeader>

      <div className="max-w-2xl space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => update('first_name', e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => update('last_name', e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="123 Main St, City, State"
              />
            </div>
          </CardContent>
        </Card>

        {/* Employment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => update('job_title', e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="employment_type">Employment Type</Label>
                <select
                  id="employment_type"
                  className={selectClassName}
                  value={formData.employment_type}
                  onChange={(e) => update('employment_type', e.target.value)}
                >
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => update('hire_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="department_id">Department</Label>
                <select
                  id="department_id"
                  className={selectClassName}
                  value={formData.department_id}
                  onChange={(e) => update('department_id', e.target.value)}
                >
                  <option value="">No department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="manager_id">Manager</Label>
              <select
                id="manager_id"
                className={selectClassName}
                value={formData.manager_id}
                onChange={(e) => update('manager_id', e.target.value)}
              >
                <option value="">No manager</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compensation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => update('salary', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="salary_currency">Currency</Label>
                <select
                  id="salary_currency"
                  className={selectClassName}
                  value={formData.salary_currency}
                  onChange={(e) => update('salary_currency', e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_name">Contact Name</Label>
                <Input
                  id="emergency_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => update('emergency_contact_name', e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <Label htmlFor="emergency_phone">Contact Phone</Label>
                <Input
                  id="emergency_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => update('emergency_contact_phone', e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Additional notes about this employee..."
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={updateEmployee.isPending}>
            {updateEmployee.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link href={`/hr/employees/${id}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
