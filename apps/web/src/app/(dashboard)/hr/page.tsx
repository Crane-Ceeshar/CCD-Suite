import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle } from '@ccd/ui';
import { Users, CalendarOff, ClipboardList, Wallet } from 'lucide-react';
import Link from 'next/link';

export default function HRDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="HR"
        description="Employee management, payroll, and compliance"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Employees"
          value="0"
          change="Active staff"
          trend="neutral"
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F97316"
        />
        <StatCard
          label="On Leave"
          value="0"
          change="Currently away"
          trend="neutral"
          icon={<CalendarOff className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F97316"
        />
        <StatCard
          label="Pending Requests"
          value="0"
          change="Leave requests"
          trend="neutral"
          icon={<ClipboardList className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F97316"
        />
        <StatCard
          label="Payroll"
          value="$0"
          change="Last run total"
          trend="neutral"
          icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F97316"
        />
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
