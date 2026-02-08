'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { ContentSettingsDialog } from '@/components/content/content-settings-dialog';
import { LayoutDashboard, Library, Calendar, FileEdit, LayoutTemplate, CheckCircle } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/content', icon: <LayoutDashboard /> },
  { label: 'Library', href: '/content/library', icon: <Library /> },
  { label: 'Calendar', href: '/content/calendar', icon: <Calendar /> },
  { label: 'Editor', href: '/content/editor', icon: <FileEdit /> },
  { label: 'Templates', href: '/content/templates', icon: <LayoutTemplate /> },
  { label: 'Approvals', href: '/content/approvals', icon: <CheckCircle /> },
];

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      moduleId="content"
      navItems={navItems}
      renderSettings={({ open, onOpenChange }) => (
        <ContentSettingsDialog open={open} onOpenChange={onOpenChange} />
      )}
    >
      {children}
    </ModuleShell>
  );
}
