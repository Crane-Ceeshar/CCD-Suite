'use client';

import * as React from 'react';
import { PageHeader, Button } from '@ccd/ui';
import { Plus } from 'lucide-react';
import { PipelineBoard } from '@/components/crm/pipeline-board';
import { DealDialog } from '@/components/crm/deal-dialog';

type DealForDialog = Parameters<typeof DealDialog>[0]['deal'];

export default function PipelinePage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editDeal, setEditDeal] = React.useState<DealForDialog>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  function handleNew() {
    setEditDeal(null);
    setDialogOpen(true);
  }

  function handleSuccess() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Pipeline"
        description="Drag and drop deals between stages"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Pipeline' },
        ]}
        actions={
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        }
      />
      <PipelineBoard
        onEditDeal={(deal) => {
          setEditDeal(deal as unknown as DealForDialog);
          setDialogOpen(true);
        }}
        onRefresh={refreshKey}
      />
      <DealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        deal={editDeal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
