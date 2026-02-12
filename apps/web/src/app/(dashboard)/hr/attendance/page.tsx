'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge, Button, Skeleton, Input, Label } from '@ccd/ui';
import { Clock, Download } from 'lucide-react';
import { useAttendance, useExportHr } from '@/hooks/use-hr';
import { AttendanceDialog } from '@/components/hr/attendance-dialog';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  present: { label: 'Present', variant: 'default' },
  absent: { label: 'Absent', variant: 'destructive' },
  late: { label: 'Late', variant: 'secondary' },
  half_day: { label: 'Half Day', variant: 'outline' },
};

function AttendanceCardSkeleton() {
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

export default function AttendancePage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const exportHr = useExportHr();

  const { data: response, isLoading } = useAttendance({
    from: fromDate || undefined,
    to: toDate || undefined,
  });
  const records = (response?.data as any[]) ?? [];

  const handleExport = () => {
    exportHr.mutate({
      type: 'attendance',
      from: fromDate || undefined,
      to: toDate || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Track employee attendance and work hours"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exportHr.isPending}>
            <Download className="mr-2 h-4 w-4" />
            {exportHr.isPending ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Clock className="mr-2 h-4 w-4" />
            Record Attendance
          </Button>
        </div>
      </PageHeader>

      {/* Date range filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div>
          <Label htmlFor="from_date">From</Label>
          <Input
            id="from_date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="to_date">To</Label>
          <Input
            id="to_date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        {(fromDate || toDate) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setFromDate(''); setToDate(''); }}
          >
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <AttendanceCardSkeleton />
          <AttendanceCardSkeleton />
          <AttendanceCardSkeleton />
          <AttendanceCardSkeleton />
        </div>
      ) : !records.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No attendance records</h3>
            <p className="text-sm text-muted-foreground">
              Start recording attendance for your team
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {records.map((record: any) => {
            const config = statusConfig[record.status];
            return (
              <Card key={record.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-medium">
                      {record.employee?.first_name?.[0]}{record.employee?.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium">
                        {record.employee?.first_name} {record.employee?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.date).toLocaleDateString()}
                        {record.clock_in && ` · In: ${new Date(record.clock_in).toLocaleTimeString()}`}
                        {record.clock_out && ` · Out: ${new Date(record.clock_out).toLocaleTimeString()}`}
                        {record.hours_worked && ` · ${record.hours_worked}h`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={config?.variant}>{config?.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <AttendanceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
