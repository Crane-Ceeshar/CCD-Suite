import { PageHeader } from '@ccd/ui';
import { Package } from 'lucide-react';

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Services"
        description="Manage your product catalog and service offerings"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Products & Services' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Products & services coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
          Define pricing, packages, and service tiers to attach to deals and invoices.
        </p>
      </div>
    </div>
  );
}
