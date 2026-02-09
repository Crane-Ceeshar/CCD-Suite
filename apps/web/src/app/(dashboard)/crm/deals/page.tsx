'use client';

import * as React from 'react';
import { PageHeader, Button } from '@ccd/ui';
import { Plus, Download, Upload, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { DealsTable } from '@/components/crm/deals-table';
import { DealDialog } from '@/components/crm/deal-dialog';
import { CsvImportDialog } from '@/components/crm/csv-import-dialog';
import { ExportFormatDialog } from '@/components/crm/export-format-dialog';
import { exportCrmData } from '@/lib/crm-export';
import type { ExportFormat } from '@/lib/crm-export';
import { apiGet } from '@/lib/api';

type DealForDialog = Parameters<typeof DealDialog>[0]['deal'];

export default function DealsPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [editDeal, setEditDeal] = React.useState<DealForDialog>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  function handleNew() {
    setEditDeal(null);
    setDialogOpen(true);
  }

  function handleSuccess() {
    setRefreshKey((k) => k + 1);
  }

  async function handleExport(format: ExportFormat) {
    try {
      const res = await apiGet<Record<string, unknown>[]>('/api/crm/deals?limit=10000');
      exportCrmData('deals', res.data, format);
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        description="All deals across your pipelines"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Deals' },
        ]}
        actions={
          <div className="flex gap-2">
            <Link href="/crm/deals/analytics">
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Deal
            </Button>
          </div>
        }
      />
      <DealsTable
        onRefresh={refreshKey}
      />
      <DealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        deal={editDeal}
        onSuccess={handleSuccess}
      />
      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entity="deals"
        onSuccess={handleSuccess}
      />
      <ExportFormatDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        entity="deals"
        onExport={handleExport}
      />
    </div>
  );
}
