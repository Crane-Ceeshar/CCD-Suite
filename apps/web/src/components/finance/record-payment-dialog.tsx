'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CcdSpinner,
  toast,
} from '@ccd/ui';
import { useRecordInvoicePayment } from '@/hooks/use-finance';

interface RecordPaymentDialogProps {
  invoiceId: string;
  invoiceTotal: number;
  amountPaid: number;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordPaymentDialog({
  invoiceId,
  invoiceTotal,
  amountPaid,
  currency,
  open,
  onOpenChange,
}: RecordPaymentDialogProps) {
  const remainingBalance = invoiceTotal - amountPaid;

  const [amount, setAmount] = useState(remainingBalance.toString());
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const recordPayment = useRecordInvoicePayment(invoiceId);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid payment amount', variant: 'destructive' });
      return;
    }

    try {
      await recordPayment.mutateAsync({
        amount: parsedAmount,
        currency,
        payment_method: paymentMethod,
        payment_date: paymentDate,
        reference: reference || undefined,
        notes: notes || undefined,
      });
      toast({ title: 'Success', description: 'Payment recorded successfully' });
      onOpenChange(false);
      // Reset form
      setAmount(remainingBalance.toString());
      setPaymentMethod('bank_transfer');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setReference('');
      setNotes('');
    } catch {
      toast({ title: 'Error', description: 'Failed to record payment', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="text-sm text-muted-foreground">
            Remaining balance:{' '}
            <span className="font-medium text-foreground">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
              }).format(remainingBalance)}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-amount">Amount</Label>
            <Input
              id="payment-amount"
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select method..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-date">Payment Date</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-reference">Reference</Label>
            <Input
              id="payment-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Transaction ID, check number, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-notes">Notes</Label>
            <textarea
              id="payment-notes"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={recordPayment.isPending}>
            {recordPayment.isPending && (
              <CcdSpinner size="sm" className="mr-2" />
            )}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
