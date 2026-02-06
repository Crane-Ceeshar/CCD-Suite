'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  UserAvatar,
  Button,
  SearchInput,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ccd/ui';
import { LogOut, Settings, Bell, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface DashboardShellProps {
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

export function DashboardShell({ user, tenant, children }: DashboardShellProps) {
  const router = useRouter();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = React.useState('');
  const isAdmin = user.user_type === 'admin';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top header bar */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-md px-4 md:px-6">
        {/* Left: Logo */}
        <Link href="/dashboard" className="flex items-center shrink-0">
          <Image
            src="/logos/logo-lockup.svg"
            alt="CCD Suite"
            width={140}
            height={36}
            className="h-8 w-auto dark:hidden"
            priority
          />
          <Image
            src="/logos/logo-lockup-light.svg"
            alt="CCD Suite"
            width={140}
            height={36}
            className="h-8 w-auto hidden dark:block"
            priority
          />
        </Link>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center px-4 max-w-xl mx-auto">
          <SearchInput
            placeholder="Search modules, contacts, deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            className="w-full bg-muted/50 border-transparent focus-within:border-border focus-within:bg-background transition-all duration-200"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />

          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
              onClick={() => router.push('/admin')}
              aria-label="Admin Portal"
            >
              <Shield className="h-4 w-4" />
            </Button>
          )}

          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative">
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
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
                  <p className="text-xs text-muted-foreground capitalize">{tenant.name}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => router.push('/admin')}>
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Portal
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Page content — modules add their own sidebar via per-module layout.tsx */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
