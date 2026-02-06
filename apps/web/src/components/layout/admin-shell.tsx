'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  UserAvatar,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@ccd/ui';
import {
  LogOut,
  LayoutDashboard,
  Users,
  Server,
  Settings,
  BrainCircuit,
  KeyRound,
  Activity,
  Shield,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/services', label: 'Services', icon: Server },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/ai-config', label: 'AI Config', icon: BrainCircuit },
  { href: '/admin/api-keys', label: 'API Keys', icon: KeyRound },
  { href: '/admin/activity', label: 'Activity', icon: Activity },
];

interface AdminShellProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    user_type: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  children: React.ReactNode;
}

export function AdminShell({ user, tenant, children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-red-200 bg-gradient-to-r from-red-50/90 via-red-50/70 to-red-50/90 backdrop-blur-xl px-4 md:px-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] dark:border-red-900/50 dark:from-red-950/60 dark:via-red-950/40 dark:to-red-950/60">
        {/* Left: Logo + Admin badge */}
        <Link href="/admin" className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 shadow-sm shadow-red-600/20">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-red-700 dark:text-red-300 leading-tight">
                CCD Suite
              </span>
              <span className="text-[10px] font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider leading-tight">
                Admin Portal
              </span>
            </div>
          </div>
        </Link>

        <div className="flex-1" />

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:ring-2 hover:ring-red-500/20 transition-all">
                <UserAvatar
                  name={user.full_name || user.email}
                  imageUrl={user.avatar_url}
                  size="sm"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">Administrator</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Admin Sidebar */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-56 flex-shrink-0 border-r bg-gradient-to-b from-card/80 to-card/50 overflow-y-auto"
        >
          <nav className="flex flex-col gap-1 p-3">
            <div className="px-3 py-2 mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Administration
              </p>
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href) && !item.exact;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-red-50 text-red-700 shadow-sm border-l-2 border-red-600 dark:bg-red-950/80 dark:text-red-300 dark:border-red-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent'
                  )}
                >
                  <item.icon className={cn('h-4 w-4', isActive && 'text-red-600 dark:text-red-400')} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Tenant info + version at bottom */}
          <div className="mt-auto border-t p-3 space-y-2">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs font-medium truncate">{tenant.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{tenant.slug}</p>
            </div>
            <p className="text-[10px] text-muted-foreground/50 text-center">
              CCD Suite v1.0.0
            </p>
          </div>
        </motion.aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
