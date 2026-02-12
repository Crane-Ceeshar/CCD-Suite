'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge, Button, Skeleton } from '@ccd/ui';
import { Plus, Users, Search, Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEmployees, useExportHr } from '@/hooks/use-hr';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'Active', variant: 'default' },
  on_leave: { label: 'On Leave', variant: 'secondary' },
  terminated: { label: 'Terminated', variant: 'destructive' },
};

const employmentLabels: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  intern: 'Intern',
};

function EmployeeCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmployeesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const exportHr = useExportHr();

  const { data: response, isLoading } = useEmployees({
    search,
    status: statusFilter === 'all' ? '' : statusFilter,
  });

  const employees = (response?.data as any[]) ?? [];

  const handleExport = () => {
    exportHr.mutate({
      type: 'employees',
      status: statusFilter === 'all' ? undefined : statusFilter,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        description="View and manage all employees"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exportHr.isPending}>
            <Download className="mr-2 h-4 w-4" />
            {exportHr.isPending ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button onClick={() => router.push('/hr/employees/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </PageHeader>

      {/* Search and filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'on_leave', 'terminated'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : statusConfig[status]?.label ?? status}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <EmployeeCardSkeleton />
          <EmployeeCardSkeleton />
          <EmployeeCardSkeleton />
          <EmployeeCardSkeleton />
          <EmployeeCardSkeleton />
          <EmployeeCardSkeleton />
        </div>
      ) : !employees.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No employees yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first employee to get started
            </p>
            <Button onClick={() => router.push('/hr/employees/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee: any) => {
            const config = statusConfig[employee.status];
            return (
              <Link key={employee.id} href={`/hr/employees/${employee.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium">
                        {employee.first_name?.[0]}{employee.last_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {employee.job_title || 'No title'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={config?.variant} className="text-xs">
                            {config?.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {employmentLabels[employee.employment_type]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
