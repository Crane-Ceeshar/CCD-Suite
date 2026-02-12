'use client';

import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Button, Skeleton } from '@ccd/ui';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Edit } from 'lucide-react';
import Link from 'next/link';
import { useEmployee, useLeaveRequests, useAttendance } from '@/hooks/use-hr';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'Active', variant: 'default' },
  on_leave: { label: 'On Leave', variant: 'secondary' },
  terminated: { label: 'Terminated', variant: 'destructive' },
};

const leaveStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  approved: { label: 'Approved', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

const attendanceStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  present: { label: 'Present', variant: 'default' },
  absent: { label: 'Absent', variant: 'destructive' },
  late: { label: 'Late', variant: 'secondary' },
  half_day: { label: 'Half Day', variant: 'outline' },
};

function ProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
          <CardContent><Skeleton className="h-4 w-40" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
          <CardContent><Skeleton className="h-4 w-40" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
          <CardContent><Skeleton className="h-4 w-40" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: response, isLoading } = useEmployee(id);
  const employee = response?.data as any;

  const { data: leaveResponse } = useLeaveRequests({ employee_id: id });
  const leaveRequests = (leaveResponse?.data as any[]) ?? [];

  const { data: attendanceResponse } = useAttendance({ employee_id: id });
  const attendanceRecords = (attendanceResponse?.data as any[]) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Employee Profile"
          description="View employee details and history"
        >
          <Link href="/hr/employees">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </PageHeader>
        <ProfileSkeleton />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Employee Not Found"
          description="This employee record could not be found"
        >
          <Link href="/hr/employees">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </PageHeader>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-1">Employee not found</h3>
            <p className="text-sm text-muted-foreground">
              The employee you are looking for does not exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusCfg = statusConfig[employee.status];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Profile"
        description="View employee details and history"
      >
        <div className="flex gap-2">
          <Link href="/hr/employees">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <Link href={`/hr/employees/${id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-2xl font-bold mb-4">
                {employee.first_name?.[0]}{employee.last_name?.[0]}
              </div>
              <h2 className="text-xl font-bold">{employee.first_name} {employee.last_name}</h2>
              <p className="text-muted-foreground">{employee.job_title || 'No title'}</p>
              {statusCfg && (
                <Badge variant={statusCfg.variant} className="mt-2">
                  {statusCfg.label}
                </Badge>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className={employee.email ? '' : 'text-muted-foreground'}>
                  {employee.email || 'No email'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className={employee.phone ? '' : 'text-muted-foreground'}>
                  {employee.phone || 'No phone'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className={employee.address ? '' : 'text-muted-foreground'}>
                  {employee.address || 'No address'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className={employee.hire_date ? '' : 'text-muted-foreground'}>
                  {employee.hire_date
                    ? `Hired: ${new Date(employee.hire_date).toLocaleDateString()}`
                    : 'Hired: --'}
                </span>
              </div>
            </div>

            {employee.department && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Department</p>
                <p className="text-sm font-medium">{employee.department.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leave History</CardTitle>
            </CardHeader>
            <CardContent>
              {!leaveRequests.length ? (
                <p className="text-sm text-muted-foreground">No leave requests</p>
              ) : (
                <div className="space-y-2">
                  {leaveRequests.map((req: any) => {
                    const cfg = leaveStatusConfig[req.status];
                    return (
                      <div key={req.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium capitalize">{req.type ?? req.leave_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(req.start_date).toLocaleDateString()} -- {new Date(req.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        {cfg && <Badge variant={cfg.variant}>{cfg.label}</Badge>}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {!attendanceRecords.length ? (
                <p className="text-sm text-muted-foreground">No attendance records</p>
              ) : (
                <div className="space-y-2">
                  {attendanceRecords.slice(0, 10).map((rec: any) => {
                    const cfg = attendanceStatusConfig[rec.status];
                    return (
                      <div key={rec.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(rec.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rec.clock_in && `In: ${new Date(rec.clock_in).toLocaleTimeString()}`}
                            {rec.clock_out && ` | Out: ${new Date(rec.clock_out).toLocaleTimeString()}`}
                            {rec.hours_worked && ` | ${rec.hours_worked}h`}
                          </p>
                        </div>
                        {cfg && <Badge variant={cfg.variant}>{cfg.label}</Badge>}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payroll History</CardTitle>
            </CardHeader>
            <CardContent>
              {!employee.payroll_items?.length ? (
                <p className="text-sm text-muted-foreground">No payroll records</p>
              ) : (
                <div className="space-y-2">
                  {employee.payroll_items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">
                          {item.payroll_run?.period_start
                            ? `${new Date(item.payroll_run.period_start).toLocaleDateString()} -- ${new Date(item.payroll_run.period_end).toLocaleDateString()}`
                            : 'Payroll Run'}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.net_pay ?? 0)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
