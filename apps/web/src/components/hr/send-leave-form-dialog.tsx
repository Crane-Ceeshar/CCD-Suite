'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@ccd/ui';
import { Loader2, Send } from 'lucide-react';
import { useEmployees, useSendLeaveForm } from '@/hooks/use-hr';

interface SendLeaveFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId?: string;
}

export function SendLeaveFormDialog({ open, onOpenChange, employeeId }: SendLeaveFormDialogProps) {
  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || '');
  const [message, setMessage] = useState('');
  const sendLeaveForm = useSendLeaveForm();
  const { data: empResponse } = useEmployees({ status: 'active', limit: 200 });
  const employees = (empResponse?.data as any[]) ?? [];

  const handleSend = async () => {
    if (!selectedEmployee) return;
    try {
      await sendLeaveForm.mutateAsync({
        employee_id: selectedEmployee,
        message: message.trim() || null,
      });
      setMessage('');
      setSelectedEmployee(employeeId || '');
      onOpenChange(false);
    } catch {
      // error handled by React Query
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Leave Request Form</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Send a leave request form link to an employee via email. They can fill it out without needing an account.
          </p>
          <div className="space-y-2">
            <Label>Employee *</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp: any) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                    {emp.email ? ` (${emp.email})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Custom Message (optional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to the email..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sendLeaveForm.isPending || !selectedEmployee}>
            {sendLeaveForm.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send Form Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
