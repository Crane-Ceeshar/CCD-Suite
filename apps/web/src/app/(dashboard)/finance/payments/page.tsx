'use client';

import { useState } from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Skeleton,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
  Label,
} from '@ccd/ui';
import { Plus, CreditCard } from 'lucide-react';
import { usePayments } from '@/hooks/use-finance';

const methodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  credit_card: 'Credit Card',
  cash: 'Cash',
  check: 'Check',
  other: 'Other',
};

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function PaymentRowSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-24" />
      </CardContent>
    </Card>
  );
}

export default function PaymentsPage() {
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const { data, isLoading } = usePayments({
    payment_method: paymentMethod || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const payments = (data?.data ?? []) as Record<string, unknown>[];
  const totalCount = (data?.count ?? 0) as number;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="View payment history and record new payments"
      >
        <Button onClick={() => setShowPaymentDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </PageHeader>

      {/* TODO: Render payment dialog when showPaymentDialog is true */}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48">
          <Label className="mb-1.5 block text-sm">Payment Method</Label>
          <Select
            value={paymentMethod || 'all'}
            onValueChange={(v) => setPaymentMethod(v === 'all' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              {Object.entries(methodLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-44">
          <Label className="mb-1.5 block text-sm">From</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="w-44">
          <Label className="mb-1.5 block text-sm">To</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        {(paymentMethod || from || to) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPaymentMethod('');
              setFrom('');
              setTo('');
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Count */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'payment' : 'payments'} found
        </p>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-2">
          <PaymentRowSkeleton />
          <PaymentRowSkeleton />
          <PaymentRowSkeleton />
          <PaymentRowSkeleton />
        </div>
      ) : payments.length === 0 ? (
        /* Empty state */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No payments recorded</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Payments will appear here when recorded against invoices
            </p>
            <Button onClick={() => setShowPaymentDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Payment list */
        <div className="space-y-2">
          {payments.map((payment: any) => (
            <Card
              key={payment.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
            >
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">
                    {payment.invoice?.invoice_number || 'Unlinked payment'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {payment.invoice?.company?.name && (
                      <>
                        <span>{payment.invoice.company.name}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>
                      {methodLabels[payment.payment_method] || payment.payment_method}
                    </span>
                    <span>·</span>
                    <span>{formatDate(payment.payment_date)}</span>
                    {payment.reference && (
                      <>
                        <span>·</span>
                        <span>Ref: {payment.reference}</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="font-semibold text-green-600">
                  +{formatCurrency(payment.amount, payment.currency || 'USD')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
