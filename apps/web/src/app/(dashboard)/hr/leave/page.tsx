'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge, Button } from '@ccd/ui';
import { CalendarOff } from 'lucide-react';

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

export default function LeavePage() {
  const [leaveRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const filteredRequests = filter === 'all' ? leaveRequests : leaveRequests.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Review and approve leave requests"
      />

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

      {filteredRequests.length === 0 ? (
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
          {filteredRequests.map((request) => {
            const config = statusConfig[request.status];
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
                        {leaveTypeLabels[request.type]} · {request.days_count} days
                        · {new Date(request.start_date).toLocaleDateString()} – {new Date(request.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={config?.variant}>{config?.label}</Badge>
                    {request.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">Reject</Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
