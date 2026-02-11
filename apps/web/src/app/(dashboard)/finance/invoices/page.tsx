'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge, Button, Input } from '@ccd/ui';
import { Plus, FileText, Send, CheckCircle, Clock, XCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { useInvoices, useDeleteInvoice } from '@/hooks/use-finance';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: FileText },
  sent: { label: 'Sent', variant: 'default', icon: Send },
  paid: { label: 'Paid', variant: 'default', icon: CheckCircle },
  overdue: { label: 'Overdue', variant: 'destructive', icon: Clock },
  cancelled: { label: 'Cancelled', variant: 'outline', icon: XCircle },
};

function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString();
}

export default function InvoicesPage() {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const { data: response, isLoading } = useInvoices({
    status: filter === 'all' ? '' : filter,
    search,
    sort: 'created_at',
    dir: 'desc',
  });

  const raw = response as { data?: unknown[]; count?: number } | undefined;
  const invoices = (raw?.data ?? []) as Record<string, unknown>[];
  const totalCount = raw?.count ?? 0;

  // useDeleteInvoice is imported and available for future use (e.g., row actions)
  const _deleteInvoice = useDeleteInvoice();

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

      {/* Search input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <div className="flex items-center justify-between">
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
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'invoice' : 'invoices'}
        </p>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading invoices...</p>
            </div>
          </CardContent>
        </Card>
      ) : invoices.length === 0 ? (
        /* Empty state */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No invoices found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || filter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first invoice to get started'}
            </p>
            {!search && filter === 'all' && (
              <Link href="/finance/invoices/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Invoice table */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Invoice Number</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Issue Date</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice: any) => {
                  const config = statusConfig[invoice.status];
                  const StatusIcon = config?.icon;
                  const contactName = invoice.contact
                    ? `${invoice.contact.first_name} ${invoice.contact.last_name}`.trim()
                    : null;

                  return (
                    <tr
                      key={invoice.id}
                      className="border-b last:border-0 transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/finance/invoices/${invoice.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm">{invoice.company?.name || 'No company'}</p>
                          {contactName && (
                            <p className="text-xs text-muted-foreground">{contactName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {invoice.issue_date ? formatDate(invoice.issue_date) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={config?.variant}>
                          {StatusIcon && <StatusIcon className="mr-1 h-3 w-3" />}
                          {config?.label || invoice.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
