'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@ccd/ui';
import { useLeaveBalances } from '@/hooks/use-hr';

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  personal: 'Personal Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  unpaid: 'Unpaid Leave',
};

const LEAVE_TYPE_COLORS: Record<string, string> = {
  annual: 'bg-blue-500',
  sick: 'bg-red-500',
  personal: 'bg-purple-500',
  maternity: 'bg-pink-500',
  paternity: 'bg-indigo-500',
  unpaid: 'bg-gray-500',
};

interface LeaveBalanceCardProps {
  employeeId: string;
  year?: number;
}

export function LeaveBalanceCard({ employeeId, year }: LeaveBalanceCardProps) {
  const currentYear = year ?? new Date().getFullYear();
  const { data: response, isLoading } = useLeaveBalances(employeeId, currentYear);
  const balances = (response?.data as Array<{
    id: string;
    leave_type: string;
    total_days: number;
    used_days: number;
    remaining_days: number;
    carry_over_days: number;
  }>) ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave Balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (balances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave Balances — {currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No leave balances configured for this year.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Leave Balances — {currentYear}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {balances.map((balance) => {
          const pct = balance.total_days > 0
            ? Math.min((balance.used_days / balance.total_days) * 100, 100)
            : 0;
          const colorClass = LEAVE_TYPE_COLORS[balance.leave_type] ?? 'bg-gray-500';

          return (
            <div key={balance.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {LEAVE_TYPE_LABELS[balance.leave_type] ?? balance.leave_type}
                </span>
                <span className="text-muted-foreground">
                  {balance.remaining_days} of {balance.total_days} days remaining
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${colorClass}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {balance.carry_over_days > 0 && (
                <p className="text-xs text-muted-foreground">
                  Includes {balance.carry_over_days} carry-over days
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
