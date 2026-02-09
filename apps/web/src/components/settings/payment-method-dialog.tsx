'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Button,
  FormField,
  CcdSpinner,
  toast,
} from '@ccd/ui';
import { CreditCard } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Payment Method Dialog                                                      */
/* -------------------------------------------------------------------------- */

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentMethodDialog({ open, onOpenChange }: PaymentMethodDialogProps) {
  const [cardNumber, setCardNumber] = React.useState('');
  const [expiry, setExpiry] = React.useState('');
  const [cvc, setCvc] = React.useState('');
  const [name, setName] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  function resetForm() {
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setName('');
  }

  async function handleSave() {
    setSaving(true);
    // Simulated save with 1s delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    toast({
      title: 'Payment method saved',
      description: 'Payment method saved successfully.',
    });
    resetForm();
    onOpenChange(false);
  }

  function handleCancel() {
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Add Payment Method
          </DialogTitle>
          <DialogDescription>
            Enter your card details to add a payment method
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <FormField label="Card Number" htmlFor="card-number">
            <Input
              id="card-number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Expiry" htmlFor="card-expiry">
              <Input
                id="card-expiry"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/YY"
                maxLength={5}
              />
            </FormField>
            <FormField label="CVC" htmlFor="card-cvc">
              <Input
                id="card-cvc"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                maxLength={4}
              />
            </FormField>
          </div>

          <FormField label="Cardholder Name" htmlFor="card-name">
            <Input
              id="card-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </FormField>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <CcdSpinner size="sm" className="mr-2" />}
            Save Payment Method
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
