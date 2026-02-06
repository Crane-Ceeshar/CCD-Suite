import { notFound } from 'next/navigation';
import { MODULES } from '@ccd/shared';
import type { ModuleId } from '@ccd/shared';
import { PageHeader, EmptyState } from '@ccd/ui';
import { LayoutGrid } from 'lucide-react';

interface ModulePageProps {
  params: Promise<{ moduleId: string }>;
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { moduleId } = await params;

  // Validate module exists
  const moduleIds = Object.keys(MODULES);
  if (!moduleIds.includes(moduleId)) {
    notFound();
  }

  const currentModule = MODULES[moduleId as ModuleId];

  return (
    <div className="space-y-6">
      <PageHeader
        title={currentModule.name}
        description={currentModule.description}
      />
      <EmptyState
        icon={<LayoutGrid className="h-6 w-6 text-muted-foreground" />}
        title={`${currentModule.name} Module`}
        description={`The ${currentModule.name} module is being built. Check back soon.`}
      />
    </div>
  );
}
