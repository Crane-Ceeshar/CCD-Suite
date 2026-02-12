'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge, Button, Skeleton } from '@ccd/ui';
import { CalendarOff, Loader2, Send } from 'lucide-react';
import { SendLeaveFormDialog } from '@/components/hr/send-leave-form-dialog';
import { useLeaveRequests, useApproveLeave } from '@/hooks/use-hr';

const leaveTypeLabels: Record<string, string> = {
  annual: 'Annual',
  sick: 'Sick',
  personal: 'Personal',
  maternity: 'Maternity',
  paternity: 'Paternity',
  unpaid: 'Unpaid',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  approved: { label: 'Approved', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

function LeaveCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </CardContent>
    </Card>
  );
}

export default function LeavePage() {
  const [sendFormOpen, setSendFormOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const approveLeave = useApproveLeave();
  const [actioningId, setActioningId] = useState<string | null>(null);

  const { data: response, isLoading } = useLeaveRequests({
    status: filter === 'all' ? '' : filter,
  });
  const leaveRequests = (response?.data as any[]) ?? [];

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActioningId(id);
    try {
      await approveLeave.mutateAsync({ id, action });
    } catch {
      // Error handled by React Query
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Leave Management"
          description="Review and approve leave requests"
        />
        <Button variant="outline" onClick={() => setSendFormOpen(true)}>
          <Send className="mr-2 h-4 w-4" />
          Send Leave Form
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : statusConfig[status]?.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <LeaveCardSkeleton />
          <LeaveCardSkeleton />
          <LeaveCardSkeleton />
        </div>
      ) : !leaveRequests.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarOff className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No leave requests</h3>
            <p className="text-sm text-muted-foreground">
              Leave requests from employees will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {leaveRequests.map((request: any) => {
            const config = statusConfig[request.status];
            const isActioning = actioningId === request.id;
            return (
              <Card key={request.id} className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-medium">
                      {request.employee?.first_name?.[0]}{request.employee?.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium">
                        {request.employee?.first_name} {request.employee?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {leaveTypeLabels[request.type] ?? leaveTypeLabels[request.leave_type] ?? request.type}
                        {request.days_count && ` · ${request.days_count} days`}
                        {request.start_date && ` · ${new Date(request.start_date).toLocaleDateString()}`}
                        {request.end_date && ` -- ${new Date(request.end_date).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={config?.variant}>{config?.label}</Badge>
                    {request.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isActioning}
                          onClick={() => handleAction(request.id, 'reject')}
                        >
                          {isActioning && actioningId === request.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : null}
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={isActioning}
                          onClick={() => handleAction(request.id, 'approve')}
                        >
                          {isActioning && actioningId === request.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : null}
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <SendLeaveFormDialog open={sendFormOpen} onOpenChange={setSendFormOpen} />
    </div>
  );
}
