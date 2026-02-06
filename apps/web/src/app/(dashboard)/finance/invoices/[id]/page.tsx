'use client';

import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@ccd/ui';
import { ArrowLeft, Send, DollarSign, Printer } from 'lucide-react';
import Link from 'next/link';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  sent: 'default',
  paid: 'default',
  overdue: 'destructive',
  cancelled: 'outline',
};

export default function InvoiceDetailPage() {
  // Placeholder — will fetch from API
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice Details"
        description="View and manage invoice"
      >
        <div className="flex gap-2">
          <Link href="/finance/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
          <Button size="sm">
            <DollarSign className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold">Invoice</h2>
                  <p className="text-muted-foreground">#INV-0001</p>
                </div>
                <Badge variant={statusColors['draft']}>Draft</Badge>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Bill To</p>
                  <p className="font-medium">No client selected</p>
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <p className="text-sm text-muted-foreground">Issue Date</p>
                    <p>{new Date().toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p>—</p>
                  </div>
                </div>
              </div>

              {/* Line items table */}
              <table className="w-full mb-8">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">Description</th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground">Qty</th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground">Price</th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No line items
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (0%)</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total</span>
                    <span>$0.00</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No payments recorded</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
