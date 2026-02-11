'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  CcdSpinner,
  toast,
} from '@ccd/ui';
import { Send, Mail, AlertCircle } from 'lucide-react';
import { useSendInvoice } from '@/hooks/use-finance';

interface SendInvoiceDialogProps {
  invoiceId: string;
  invoiceNumber: string;
  contactEmail?: string | null;
  contactName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendInvoiceDialog({
  invoiceId,
  invoiceNumber,
  contactEmail,
  contactName,
  open,
  onOpenChange,
}: SendInvoiceDialogProps) {
  const sendInvoice = useSendInvoice();

  const handleSend = async () => {
    try {
      const result = await sendInvoice.mutateAsync(invoiceId);
      const data = result.data as { email_sent?: boolean; recipient_email?: string } | undefined;

      if (data?.email_sent) {
        toast({
          title: 'Invoice sent',
          description: `Invoice ${invoiceNumber} emailed to ${data.recipient_email}`,
        });
      } else if (contactEmail) {
        toast({
          title: 'Invoice marked as sent',
          description: `Invoice ${invoiceNumber} status updated but the email could not be delivered. Please check your email configuration.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Invoice marked as sent',
          description: `Invoice ${invoiceNumber} status updated. No contact email was set — no email was sent.`,
        });
      }
      onOpenChange(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to send invoice', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Send Invoice</DialogTitle>
          <DialogDescription>
            Send invoice <span className="font-medium">{invoiceNumber}</span> and
            update its status to &quot;Sent&quot;.
          </DialogDescription>
        </DialogHeader>

        {/* Email recipient info */}
        <div className="space-y-3 py-2">
          {contactEmail ? (
            <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
              <Mail className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Email will be sent to:</p>
                <p className="text-muted-foreground">
                  {contactName && <span>{contactName} — </span>}
                  {contactEmail}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-700 dark:text-yellow-300">No contact email</p>
                <p className="text-muted-foreground">
                  No contact with an email address is linked to this invoice. The status
                  will be updated but no email will be sent.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sendInvoice.isPending}>
            {sendInvoice.isPending ? (
              <CcdSpinner size="sm" className="mr-2" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {contactEmail ? 'Send Invoice' : 'Mark as Sent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
