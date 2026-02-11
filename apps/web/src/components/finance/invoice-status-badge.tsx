'use client';

import { Badge } from '@ccd/ui';
import { FileText, Send, CheckCircle, Clock, XCircle } from 'lucide-react';

const statusConfig = {
  draft: { label: 'Draft', variant: 'secondary' as const, icon: FileText },
  sent: { label: 'Sent', variant: 'default' as const, icon: Send },
  paid: { label: 'Paid', variant: 'default' as const, icon: CheckCircle },
  overdue: { label: 'Overdue', variant: 'destructive' as const, icon: Clock },
  cancelled: { label: 'Cancelled', variant: 'outline' as const, icon: XCircle },
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.draft;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
