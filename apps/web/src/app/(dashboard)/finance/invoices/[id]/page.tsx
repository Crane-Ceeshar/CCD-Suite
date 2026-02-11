'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  CcdLoader,
  toast,
} from '@ccd/ui';
import {
  ArrowLeft,
  Send,
  DollarSign,
  Printer,
  Pencil,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import {
  useInvoice,
  useInvoicePayments,
  useDeleteInvoice,
} from '@/hooks/use-finance';
import { InvoiceStatusBadge } from '@/components/finance/invoice-status-badge';
import { RecordPaymentDialog } from '@/components/finance/record-payment-dialog';
import { SendInvoiceDialog } from '@/components/finance/send-invoice-dialog';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    amount
  );
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();

  const { data: invoiceRes, isLoading, error } = useInvoice(id);
  const { data: paymentsRes } = useInvoicePayments(id);
  const deleteInvoice = useDeleteInvoice();

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <CcdLoader size="lg" />
      </div>
    );
  }

  // Error / 404 state
  if (error || !invoiceRes?.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Invoice Not Found" description="The requested invoice could not be loaded.">
          <Link href="/finance/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
          </Link>
        </PageHeader>
      </div>
    );
  }

  // Safe cast — the API returns a known shape but useQuery types it as unknown
  const inv = invoiceRes.data as {
    id: string;
    invoice_number: string;
    status: string;
    issue_date: string;
    due_date: string | null;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    currency: string;
    notes: string | null;
    created_at: string;
    items: { id: string; description: string; quantity: number; unit_price: number }[];
    company: { id: string; name: string } | null;
    contact: { id: string; first_name: string; last_name: string; email?: string } | null;
  };

  const paymentList = ((paymentsRes?.data ?? []) as {
    id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference: string | null;
  }[]);

  const currency = inv.currency ?? 'USD';

  const totalPaid = paymentList.reduce(
    (sum, p) => sum + (p.amount ?? 0),
    0
  );

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this draft invoice?')) return;
    try {
      await deleteInvoice.mutateAsync(id);
      toast({ title: 'Success', description: 'Invoice deleted' });
      router.push('/finance/invoices');
    } catch {
      toast({ title: 'Error', description: 'Failed to delete invoice', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div data-print-hide>
        <PageHeader
          title="Invoice Details"
          description={`Viewing invoice ${inv.invoice_number}`}
        >
          <div className="flex gap-2">
            <Link href="/finance/invoices">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>

            {/* Draft actions */}
            {inv.status === 'draft' && (
              <>
                <Link href={`/finance/invoices/${id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSendDialog(true)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteInvoice.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}

            {/* Sent actions */}
            {inv.status === 'sent' && (
              <>
                <Button
                  size="sm"
                  onClick={() => setShowPaymentDialog(true)}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSendDialog(true)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Resend
                </Button>
              </>
            )}

            {/* Overdue actions */}
            {inv.status === 'overdue' && (
              <Button size="sm" onClick={() => setShowPaymentDialog(true)}>
                <DollarSign className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            )}

            {/* Paid indicator */}
            {inv.status === 'paid' && (
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium px-3">
                <CheckCircle className="h-4 w-4" />
                Fully Paid
              </div>
            )}
          </div>
        </PageHeader>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice preview */}
        <div className="lg:col-span-2" data-print-invoice>
          <Card>
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold print:text-3xl">Invoice</h2>
                  <p className="text-muted-foreground print:text-black/60">
                    #{inv.invoice_number}
                  </p>
                </div>
                <div data-print-hide>
                  <InvoiceStatusBadge status={inv.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Bill To
                  </p>
                  {inv.company ? (
                    <p className="font-medium">{inv.company.name}</p>
                  ) : inv.contact ? (
                    <p className="font-medium">
                      {inv.contact.first_name} {inv.contact.last_name}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">No client selected</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <p className="text-sm text-muted-foreground">Issue Date</p>
                    <p>{formatDate(inv.issue_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p>{formatDate(inv.due_date)}</p>
                  </div>
                </div>
              </div>

              {/* Line items table */}
              <table className="w-full mb-8">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground">
                      Qty
                    </th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground">
                      Price
                    </th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inv.items && inv.items.length > 0 ? (
                    inv.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 text-sm">{item.description}</td>
                        <td className="py-3 text-sm text-right">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-sm text-right">
                          {formatCurrency(item.unit_price, currency)}
                        </td>
                        <td className="py-3 text-sm text-right font-medium">
                          {formatCurrency(
                            item.quantity * item.unit_price,
                            currency
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No line items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      {formatCurrency(inv.subtotal ?? 0, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tax ({inv.tax_rate ?? 0}%)
                    </span>
                    <span>
                      {formatCurrency(inv.tax_amount ?? 0, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total</span>
                    <span>
                      {formatCurrency(inv.total ?? 0, currency)}
                    </span>
                  </div>
                  {totalPaid > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Paid</span>
                        <span>
                          -{formatCurrency(totalPaid, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-sm border-t pt-2">
                        <span>Balance Due</span>
                        <span>
                          {formatCurrency(
                            Math.max(0, (inv.total ?? 0) - totalPaid),
                            currency
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              {inv.notes && (
                <div className="mt-8 pt-6 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{inv.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4" data-print-hide>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentList.length > 0 ? (
                <div className="space-y-3">
                  {paymentList.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(payment.amount, currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.payment_date)}
                        </p>
                        {payment.payment_method && (
                          <p className="text-xs text-muted-foreground capitalize">
                            {payment.payment_method.replace('_', ' ')}
                          </p>
                        )}
                        {payment.reference && (
                          <p className="text-xs text-muted-foreground">
                            Ref: {payment.reference}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total Paid</span>
                      <span>{formatCurrency(totalPaid, currency)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No payments recorded
                </p>
              )}
            </CardContent>
          </Card>

          {/* Invoice metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <InvoiceStatusBadge status={inv.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency</span>
                <span>{currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(inv.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <RecordPaymentDialog
        invoiceId={id}
        invoiceTotal={inv.total ?? 0}
        amountPaid={totalPaid}
        currency={currency}
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
      />

      <SendInvoiceDialog
        invoiceId={id}
        invoiceNumber={inv.invoice_number ?? ''}
        contactEmail={inv.contact?.email ?? null}
        contactName={
          inv.contact
            ? [inv.contact.first_name, inv.contact.last_name].filter(Boolean).join(' ')
            : null
        }
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
      />
    </div>
  );
}
