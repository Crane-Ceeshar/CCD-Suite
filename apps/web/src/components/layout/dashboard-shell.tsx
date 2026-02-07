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
import { LogOut, Settings, Bell, HelpCircle, UserPlus, Clock, Zap } from 'lucide-react';
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
    trial_ends_at?: string | null;
    settings?: { modules_enabled?: string[] };
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, tenant, children }: DashboardShellProps) {
  const router = useRouter();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = React.useState('');

  // Trial banner calculation
  const trialDaysRemaining = React.useMemo(() => {
    if (!tenant.trial_ends_at) return null;
    const now = new Date();
    const end = new Date(tenant.trial_ends_at);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [tenant.trial_ends_at]);

  const showTrialBanner = trialDaysRemaining !== null && trialDaysRemaining > 0;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top header bar */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-gradient-to-r from-card/90 via-card/80 to-card/90 backdrop-blur-xl px-4 md:px-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]">
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
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-1.5 h-8 rounded-lg text-xs font-medium border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
            title="Help & Support"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          <ThemeToggle />

          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </Button>

          <div className="w-px h-6 bg-border/60 mx-0.5 hidden md:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-primary/20 transition-all">
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Trial banner */}
      {showTrialBanner && (
        <div className="flex items-center justify-center gap-3 px-4 py-2.5 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border-b border-amber-500/20">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Free trial:</span>{' '}
            {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining
          </p>
          <Link href="/settings/billing">
            <Button
              size="sm"
              className="h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              <Zap className="h-3 w-3" />
              Upgrade Now
            </Button>
          </Link>
        </div>
      )}

      {/* Page content — modules add their own sidebar via per-module layout.tsx */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
