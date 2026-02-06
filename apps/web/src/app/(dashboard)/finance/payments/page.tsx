'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Button } from '@ccd/ui';
import { Plus, CreditCard } from 'lucide-react';

const methodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  credit_card: 'Credit Card',
  cash: 'Cash',
  check: 'Check',
  other: 'Other',
};

export default function PaymentsPage() {
  const [payments] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="View payment history and record new payments"
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </PageHeader>

      {/* Payment list */}
      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No payments recorded</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Payments will appear here when recorded against invoices
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => (
            <Card key={payment.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">
                    {payment.invoice?.invoice_number || 'Unlinked payment'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{methodLabels[payment.payment_method] || payment.payment_method}</span>
                    <span>·</span>
                    <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                    {payment.reference && (
                      <>
                        <span>·</span>
                        <span>Ref: {payment.reference}</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="font-semibold text-green-600">
                  +{new Intl.NumberFormat('en-US', { style: 'currency', currency: payment.currency || 'USD' }).format(payment.amount)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
