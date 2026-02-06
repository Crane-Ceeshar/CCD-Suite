'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@ccd/ui';
import {
  LayoutDashboard,
  Users,
  Server,
  Settings,
  BrainCircuit,
  KeyRound,
  Activity,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/services', label: 'Services', icon: Server },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/ai-config', label: 'AI Config', icon: BrainCircuit },
  { href: '/admin/api-keys', label: 'API Keys', icon: KeyRound },
  { href: '/admin/activity', label: 'Activity', icon: Activity },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex gap-6">
      <nav className="w-48 flex-shrink-0 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
