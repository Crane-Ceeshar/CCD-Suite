'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge, Button } from '@ccd/ui';
import { Clock } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  present: { label: 'Present', variant: 'default' },
  absent: { label: 'Absent', variant: 'destructive' },
  late: { label: 'Late', variant: 'secondary' },
  half_day: { label: 'Half Day', variant: 'outline' },
};

export default function AttendancePage() {
  const [records] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Track employee attendance and work hours"
      >
        <Button>
          <Clock className="mr-2 h-4 w-4" />
          Record Attendance
        </Button>
      </PageHeader>

      {records.length === 0 ? (
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
          {records.map((record) => {
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
    </div>
  );
}
