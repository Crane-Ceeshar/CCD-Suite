'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Label } from '@ccd/ui';
import { CheckCircle, Loader2, AlertCircle, CalendarOff } from 'lucide-react';

type FormState = 'loading' | 'ready' | 'submitting' | 'success' | 'error' | 'no_token';

const leaveTypeLabels: Record<string, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  personal: 'Personal Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  unpaid: 'Unpaid Leave',
};

export default function LeaveRequestFormPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [state, setState] = React.useState<FormState>(token ? 'loading' : 'no_token');
  const [error, setError] = React.useState('');
  const [employee, setEmployee] = React.useState<any>(null);
  const [balances, setBalances] = React.useState<any[]>([]);

  // Form fields
  const [leaveType, setLeaveType] = React.useState('annual');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [reason, setReason] = React.useState('');

  const hasVerified = React.useRef(false);

  // Verify token
  React.useEffect(() => {
    if (!token || hasVerified.current) return;
    hasVerified.current = true;

    async function verify() {
      try {
        const res = await fetch('/api/hr/leave-form/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setState('error');
          setError(data.error?.message || 'Invalid or expired form link');
          return;
        }
        setEmployee(data.data.employee);
        setBalances(data.data.balances ?? []);
        setState('ready');
      } catch {
        setState('error');
        setError('Failed to verify form link');
      }
    }
    verify();
  }, [token]);

  // Calculate business days
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    let days = 0;
    const current = new Date(s);
    while (current <= e) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) days++;
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const daysCount = calculateDays(startDate, endDate);

  const selectedBalance = balances.find((b: any) => b.leave_type === leaveType);

  const handleSubmit = async () => {
    if (!startDate || !endDate || daysCount <= 0) return;

    setState('submitting');
    try {
      const res = await fetch('/api/hr/leave-form/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          days_count: daysCount,
          reason: reason || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setState('ready');
        setError(data.error?.message || 'Failed to submit request');
        return;
      }
      setState('success');
    } catch {
      setState('ready');
      setError('Failed to submit request');
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === 'error' || state === 'no_token') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {state === 'no_token' ? 'Missing Token' : 'Invalid Link'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {error || 'No form token was provided. Please use the link from your email.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Leave Request Submitted</h2>
            <p className="text-sm text-muted-foreground">
              Your leave request has been submitted and is pending approval. You may close this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center mb-8">
          <CalendarOff className="h-10 w-10 text-orange-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold mb-2">Leave Request</h1>
          {employee && (
            <p className="text-muted-foreground">
              {employee.first_name} {employee.last_name}
            </p>
          )}
        </div>

        {/* Leave Balances */}
        {balances.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Leave Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {balances.map((balance: any) => (
                  <div key={balance.id} className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground capitalize">
                      {leaveTypeLabels[balance.leave_type] ?? balance.leave_type}
                    </p>
                    <p className="text-lg font-bold">
                      {balance.remaining_days ?? (balance.total_days - balance.used_days)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of {balance.total_days} days remaining
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {Object.entries(leaveTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {selectedBalance && (
                <p className="text-xs text-muted-foreground">
                  Remaining: {selectedBalance.remaining_days ?? (selectedBalance.total_days - selectedBalance.used_days)} days
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>

            {daysCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{daysCount} business day{daysCount !== 1 ? 's' : ''}</Badge>
              </div>
            )}

            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief reason for leave..."
                rows={3}
                className="w-full px-3 py-2 border rounded-md text-sm resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={state === 'submitting' || !startDate || !endDate || daysCount <= 0}
            >
              {state === 'submitting' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Submit Leave Request
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
