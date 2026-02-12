'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@ccd/ui';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCreateEmployee, useDepartments, useEmployees } from '@/hooks/use-hr';

export default function NewEmployeePage() {
  const router = useRouter();
  const createEmployee = useCreateEmployee();

  const { data: deptResponse } = useDepartments();
  const departments = (deptResponse?.data as any[]) ?? [];

  const { data: empResponse } = useEmployees({ status: 'active', limit: 100 });
  const managers = (empResponse?.data as any[]) ?? [];

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    employment_type: 'full_time',
    hire_date: new Date().toISOString().split('T')[0],
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    department_id: '',
    manager_id: '',
    salary: '',
    salary_currency: 'USD',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload: Record<string, unknown> = { ...formData };
    // Convert salary to number if provided
    if (formData.salary) {
      payload.salary = parseFloat(formData.salary);
    } else {
      delete payload.salary;
    }
    // Remove empty optional fields
    if (!formData.department_id) delete payload.department_id;
    if (!formData.manager_id) delete payload.manager_id;

    try {
      await createEmployee.mutateAsync(payload);
      router.push('/hr/employees');
    } catch {
      // Error is handled by React Query
    }
  };

  const selectClasses = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Employee"
        description="Create a new employee record"
      >
        <Link href="/hr/employees">
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
                  className={errors.first_name ? 'border-destructive' : ''}
                />
                {errors.first_name && (
                  <p className="text-xs text-destructive mt-1">{errors.first_name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => update('last_name', e.target.value)}
                  placeholder="Doe"
                  className={errors.last_name ? 'border-destructive' : ''}
                />
                {errors.last_name && (
                  <p className="text-xs text-destructive mt-1">{errors.last_name}</p>
                )}
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
                  className={selectClasses}
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
                <Label htmlFor="department_id">Department</Label>
                <select
                  id="department_id"
                  className={selectClasses}
                  value={formData.department_id}
                  onChange={(e) => update('department_id', e.target.value)}
                >
                  <option value="">Select department...</option>
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="manager_id">Manager</Label>
                <select
                  id="manager_id"
                  className={selectClasses}
                  value={formData.manager_id}
                  onChange={(e) => update('manager_id', e.target.value)}
                >
                  <option value="">Select manager...</option>
                  {managers.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="hire_date">Hire Date</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => update('hire_date', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => update('salary', e.target.value)}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label htmlFor="salary_currency">Currency</Label>
                <select
                  id="salary_currency"
                  className={selectClasses}
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

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={createEmployee.isPending}>
            {createEmployee.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Employee
          </Button>
          <Link href="/hr/employees">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
