'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@ccd/ui';
import {
  Settings,
  UserCog,
  Mail,
  FileSignature,
  Palette,
  ShieldOff,
  GitBranch,
  Sparkles,
  Link2,
  ArrowLeft,
} from 'lucide-react';

const sidebarGroups = [
  {
    label: 'Emails & Activities',
    items: [
      {
        label: 'Account setup',
        href: '/crm/settings',
        icon: UserCog,
      },
      {
        label: 'Log outgoing emails',
        href: '/crm/settings/email-logging',
        icon: Mail,
      },
      {
        label: 'Email signature',
        href: '/crm/settings/email-signature',
        icon: FileSignature,
      },
      {
        label: 'Email branding',
        href: '/crm/settings/email-branding',
        icon: Palette,
      },
      {
        label: 'Never log',
        href: '/crm/settings/never-log',
        icon: ShieldOff,
      },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      {
        label: 'Pipeline settings',
        href: '/crm/settings/pipeline',
        icon: GitBranch,
      },
    ],
  },
  {
    label: 'Data',
    items: [
      {
        label: 'Enrichment suggestions',
        href: '/crm/settings/enrichment',
        icon: Sparkles,
      },
      {
        label: 'Item association',
        href: '/crm/settings/association',
        icon: Link2,
      },
    ],
  },
];

export default function CRMSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0">
      {/* Settings Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r bg-muted/30">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-sm font-semibold">CRM Settings</h2>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sidebarGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/crm/settings' &&
                      pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                          isActive
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t px-3 py-3">
          <Link
            href="/crm"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to CRM
          </Link>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
