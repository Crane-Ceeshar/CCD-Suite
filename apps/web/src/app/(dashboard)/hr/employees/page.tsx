'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge, Button } from '@ccd/ui';
import { Plus, Users } from 'lucide-react';
import Link from 'next/link';

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

export default function EmployeesPage() {
  const [employees] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        description="View and manage all employees"
      >
        <Link href="/hr/employees/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      </PageHeader>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No employees yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first employee to get started
            </p>
            <Link href="/hr/employees/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => {
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
