'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  CcdSpinner,
  toast,
} from '@ccd/ui';
import { apiPost, apiPatch } from '@/lib/api';

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'email' | 'phone';
  currentValue: string;
  newValue: string;
  onVerified: () => void;
}

export function VerificationDialog({
  open,
  onOpenChange,
  type,
  currentValue,
  newValue,
  onVerified,
}: VerificationDialogProps) {
  const [step, setStep] = React.useState<'send' | 'verify'>('send');
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [code, setCode] = React.useState('');

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setStep('send');
      setSending(false);
      setVerifying(false);
      setCode('');
    }
  }, [open]);

  const label = type === 'email' ? 'Email' : 'Phone';

  async function handleSendCode() {
    setSending(true);
    try {
      await apiPost('/api/settings/verify', { type, value: newValue });
      toast({
        title: 'Code sent',
        description: `Verification code sent to ${newValue}`,
      });
      setStep('verify');
    } catch (err) {
      toast({
        title: 'Failed to send code',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }

  async function handleVerify() {
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      toast({
        title: 'Invalid code',
        description: 'Please enter a 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    setVerifying(true);
    try {
      await apiPatch('/api/settings/verify', { type, value: newValue, code });
      toast({
        title: 'Verified',
        description: `${label} has been verified and updated.`,
      });
      onVerified();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Verification failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Verify {label}</DialogTitle>
          <DialogDescription>
            {step === 'send'
              ? `We'll send a verification code to confirm this change.`
              : `Enter the 6-digit code sent to ${newValue}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current / New values */}
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">Current {label.toLowerCase()}</span>
              <span className="font-medium">{currentValue || 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-primary/5 px-3 py-2">
              <span className="text-muted-foreground">New {label.toLowerCase()}</span>
              <span className="font-medium text-primary">{newValue}</span>
            </div>
          </div>

          {/* Code input (shown after sending) */}
          {step === 'verify' && (
            <div className="space-y-2">
              <Input
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(val);
                }}
                maxLength={6}
                className="text-center text-lg tracking-[0.3em] font-mono"
                autoFocus
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === 'send' ? (
            <Button onClick={handleSendCode} disabled={sending || !newValue}>
              {sending && <CcdSpinner size="sm" className="mr-2" />}
              Send Verification Code
            </Button>
          ) : (
            <Button onClick={handleVerify} disabled={verifying || code.length !== 6}>
              {verifying && <CcdSpinner size="sm" className="mr-2" />}
              Verify &amp; Update
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
