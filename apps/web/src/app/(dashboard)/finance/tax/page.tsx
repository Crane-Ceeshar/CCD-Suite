import { PageHeader } from '@ccd/ui';
import { Calculator } from 'lucide-react';

export default function TaxPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax"
        description="Tax calculations and compliance management"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Tax' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
        <Calculator className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Tax management coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
          Automate tax calculations, generate reports, and stay compliant with local regulations.
        </p>
      </div>
    </div>
  );
}
