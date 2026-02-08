'use client';

import { ModuleShell } from '@/components/layout/module-shell';
import { SocialSettingsDialog } from '@/components/social/social-settings-dialog';
import { LayoutDashboard, Edit, FileText, Megaphone, Globe, MessageCircle } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/social', icon: <LayoutDashboard /> },
  { label: 'Compose', href: '/social/compose', icon: <Edit /> },
  { label: 'Posts', href: '/social/posts', icon: <FileText /> },
  { label: 'Campaigns', href: '/social/campaigns', icon: <Megaphone /> },
  { label: 'Accounts', href: '/social/accounts', icon: <Globe /> },
  { label: 'Engagement', href: '/social/engagement', icon: <MessageCircle /> },
];

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      moduleId="social"
      navItems={navItems}
      renderSettings={({ open, onOpenChange }) => (
        <SocialSettingsDialog open={open} onOpenChange={onOpenChange} />
      )}
    >
      {children}
    </ModuleShell>
  );
}
