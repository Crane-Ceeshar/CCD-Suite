'use client';

import { PageHeader } from '@ccd/ui';
import { InvoiceForm } from '@/components/finance/invoice-form';

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Invoice"
        description="Create a new invoice with line items"
      />
      <InvoiceForm />
    </div>
  );
}
