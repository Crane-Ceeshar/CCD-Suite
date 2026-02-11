'use client';

import { PageHeader } from '@ccd/ui';
import { ClientAccessManager } from '@/components/portal/client-access-manager';

export default function ClientPortalSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Portal Settings"
        description="Manage client access and portal configuration"
      />
      <div className="max-w-2xl">
        <ClientAccessManager />
      </div>
    </div>
  );
}
