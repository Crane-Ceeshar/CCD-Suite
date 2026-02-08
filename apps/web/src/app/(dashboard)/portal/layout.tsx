'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { PortalSettingsDialog } from '@/components/portal/portal-settings-dialog';
import { LayoutDashboard, FolderOpen, FileArchive, MessageSquare } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/portal', icon: <LayoutDashboard /> },
  { label: 'Projects', href: '/portal/projects', icon: <FolderOpen /> },
  { label: 'Files', href: '/portal/files', icon: <FileArchive /> },
  { label: 'Messages', href: '/portal/messages', icon: <MessageSquare /> },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      moduleId="client_portal"
      navItems={navItems}
      renderSettings={({ open, onOpenChange }) => (
        <PortalSettingsDialog open={open} onOpenChange={onOpenChange} />
      )}
    >
      {children}
    </ModuleShell>
  );
}
