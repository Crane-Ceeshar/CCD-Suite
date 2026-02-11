'use client';

import { PageHeader, Button } from '@ccd/ui';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { InvoiceForm } from '@/components/finance/invoice-form';

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Invoice"
        description="Create a new invoice with line items"
      >
        <Link href="/finance/invoices">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
      </PageHeader>
      <InvoiceForm />
    </div>
  );
}
