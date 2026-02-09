'use client';

import * as React from 'react';
import { PageHeader, Button } from '@ccd/ui';
import { Plus, Download, Upload } from 'lucide-react';
import { CompaniesTable } from '@/components/crm/companies-table';
import { CompanyDialog } from '@/components/crm/company-dialog';
import { CsvImportDialog } from '@/components/crm/csv-import-dialog';
import { ExportFormatDialog } from '@/components/crm/export-format-dialog';
import { exportCrmData } from '@/lib/crm-export';
import type { ExportFormat } from '@/lib/crm-export';
import { apiGet } from '@/lib/api';

type CompanyForDialog = Parameters<typeof CompanyDialog>[0]['company'];

export default function CompaniesPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [editCompany, setEditCompany] = React.useState<CompanyForDialog>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  function handleNew() {
    setEditCompany(null);
    setDialogOpen(true);
  }

  function handleSuccess() {
    setRefreshKey((k) => k + 1);
  }

  async function handleExport(format: ExportFormat) {
    try {
      const res = await apiGet<Record<string, unknown>[]>('/api/crm/companies?limit=10000');
      exportCrmData('companies', res.data, format);
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Track organisations and business relationships"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Companies' },
        ]}
        actions={
          <div className="flex gap-2">
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
              New Company
            </Button>
          </div>
        }
      />
      <CompaniesTable
        onRefresh={refreshKey}
      />
      <CompanyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={editCompany}
        onSuccess={handleSuccess}
      />
      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entity="companies"
        onSuccess={handleSuccess}
      />
      <ExportFormatDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        entity="companies"
        onExport={handleExport}
      />
    </div>
  );
}
