import { PageHeader, Button } from '@ccd/ui';
import { Plus } from 'lucide-react';
import { PipelineBoard } from '@/components/crm/pipeline-board';

export default function PipelinePage() {
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        }
      />
      <PipelineBoard />
    </div>
  );
}
