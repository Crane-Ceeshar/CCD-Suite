'use client';

import {
  PageHeader,
  StatCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@ccd/ui';
import { Users, CalendarOff, ClipboardList, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useHrStats } from '@/hooks/use-hr';

const MODULE_COLOR = '#F97316';

function formatCurrency(value: number | undefined | null): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: MODULE_COLOR }}
      />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-11 w-11 rounded-lg" />
        </div>
        <Skeleton className="mt-3 h-3 w-24" />
      </CardContent>
    </Card>
  );
}

export default function HRDashboardPage() {
  const { data: rawStats, isLoading } = useHrStats();
  const stats = rawStats?.data as {
    active_employees: number;
    on_leave: number;
    pending_requests: number;
    last_payroll_total: number;
  } | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR"
        description="Employee management, payroll, and compliance"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Employees"
              value={stats?.active_employees ?? 0}
              change="Active staff"
              trend={(stats?.active_employees ?? 0) > 0 ? 'up' : 'neutral'}
              icon={<Users className="h-5 w-5 text-muted-foreground" />}
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label="On Leave"
              value={stats?.on_leave ?? 0}
              change="Currently away"
              trend={(stats?.on_leave ?? 0) > 0 ? 'down' : 'neutral'}
              icon={<CalendarOff className="h-5 w-5 text-muted-foreground" />}
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label="Pending Requests"
              value={stats?.pending_requests ?? 0}
              change="Leave requests"
              trend={(stats?.pending_requests ?? 0) > 0 ? 'down' : 'neutral'}
              icon={<ClipboardList className="h-5 w-5 text-muted-foreground" />}
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label="Payroll"
              value={formatCurrency(stats?.last_payroll_total)}
              change="Last run total"
              trend={(stats?.last_payroll_total ?? 0) > 0 ? 'up' : 'neutral'}
              icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
              moduleColor={MODULE_COLOR}
            />
          </>
        )}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/hr/employees">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Employee Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage all employees
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/hr/departments">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage departments and teams
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/hr/leave">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Leave Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review and approve leave requests
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/hr/payroll">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Payroll</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Run payroll and view history
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
