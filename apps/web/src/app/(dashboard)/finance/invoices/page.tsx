'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge, Button } from '@ccd/ui';
import { Plus, FileText, Send, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: FileText },
  sent: { label: 'Sent', variant: 'default', icon: Send },
  paid: { label: 'Paid', variant: 'default', icon: CheckCircle },
  overdue: { label: 'Overdue', variant: 'destructive', icon: Clock },
  cancelled: { label: 'Cancelled', variant: 'outline', icon: XCircle },
};

export default function InvoicesPage() {
  const [invoices] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const filteredInvoices = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Create and manage client invoices"
      >
        <Link href="/finance/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </PageHeader>

      {/* Status filter */}
      <div className="flex gap-2">
        {['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : statusConfig[status]?.label}
          </Button>
        ))}
      </div>

      {/* Invoice list */}
      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No invoices yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first invoice to get started
            </p>
            <Link href="/finance/invoices/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredInvoices.map((invoice) => {
            const config = statusConfig[invoice.status];
            return (
              <Link key={invoice.id} href={`/finance/invoices/${invoice.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.company?.name || 'No company'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={config?.variant}>{config?.label}</Badge>
                      <p className="font-semibold">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(invoice.total)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
