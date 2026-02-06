'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MODULES, getModulesForUserType } from '@ccd/shared';
import type { ModuleId } from '@ccd/shared';
import { ModuleIcon } from '@ccd/ui';
import { createClient } from '@/lib/supabase/client';
import { ArrowRight, Sparkles } from 'lucide-react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDateString(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const ROLE_TITLE_LABELS: Record<string, string> = {
  ceo_founder: 'CEO / Founder',
  director: 'Director',
  head_of_department: 'Head of Department',
  manager: 'Manager',
  team_lead: 'Team Lead',
  other: '',
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
};

export default function DashboardPage() {
  const [user, setUser] = React.useState<{ full_name: string; user_type: string; role_title?: string } | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('profiles')
          .select('full_name, user_type, role_title')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) setUser(profile);
          });
      }
    });
  }, []);

  if (!mounted || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allowedModules = getModulesForUserType(user.user_type)
    .filter((id) => id !== 'admin');

  const firstName = user.full_name?.split(' ')[0] || 'there';

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 rounded-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 border border-border/50 p-6 md:p-8 relative overflow-hidden"
      >
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.03]">
          <svg viewBox="0 0 525 448.86" className="w-full h-full">
            <path fill="currentColor" d="M525,0l-210.32,140.44c-9.99.44-19.05-2.32-29.3-2.4-46.8-.26-88.04,18.28-117.71,47.65L0,142.58,525,0h0Z"/>
            <polygon fill="currentColor" points="525 0 219.53 448.86 235.08 253.87 525 0"/>
            <path fill="currentColor" d="M274.44,177.18c-10.5,8.7-22.66,19.13-34.68,27.38h0c-.88.63-1.73,1.22-2.65,1.81-8.18,5.27-19.38,9.1-22.26-3.91-.26-1.14-.41-2.28-.48-3.35-.88-14.59,13.52-26.75,26.79-29.92,10.1-2.43,23.03-.66,31.29,5.86.52.41,1.47,1.51,1.99,2.14h0Z"/>
          </svg>
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Sparkles className="h-4 w-4 text-secondary" />
            {getDateString()}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground">
            {getGreeting()}, {firstName}
          </h1>
          {user.role_title && ROLE_TITLE_LABELS[user.role_title] && (
            <p className="text-muted-foreground mt-1 text-sm">
              {ROLE_TITLE_LABELS[user.role_title]}
            </p>
          )}
          <p className="text-muted-foreground/60 mt-2 text-sm">
            Here&apos;s your workspace overview
          </p>
        </div>
      </motion.div>

      {/* Module Cards Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {allowedModules.map((moduleId) => {
          const mod = MODULES[moduleId];
          if (!mod) return null;

          return (
            <motion.div key={moduleId} variants={item}>
              <Link href={mod.basePath}>
                <div
                  className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1 cursor-pointer ring-1 ring-black/[0.03] dark:ring-white/[0.03]"
                  style={{
                    borderColor: 'transparent',
                  }}
                >
                  {/* Colored accent line at top — gradient */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
                    style={{
                      background: `linear-gradient(90deg, ${mod.color}, ${mod.color}80)`,
                    }}
                  />

                  {/* Module icon */}
                  <div
                    className="mb-4 inline-flex items-center justify-center rounded-xl p-3 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${mod.color}15` }}
                  >
                    <ModuleIcon moduleId={moduleId as ModuleId} size="md" />
                  </div>

                  {/* Module info */}
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {mod.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {mod.description}
                  </p>

                  {/* Arrow indicator — button style on hover */}
                  <div
                    className="inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-300 group-hover:gap-2 px-2.5 py-1 -ml-2.5 rounded-lg group-hover:bg-black/[0.03] dark:group-hover:bg-white/[0.03]"
                    style={{ color: mod.color }}
                  >
                    Open
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>

                  {/* Hover glow effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 rounded-2xl"
                    style={{ backgroundColor: mod.color }}
                  />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-10"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="rounded-2xl border bg-card p-8 text-center ring-1 ring-black/[0.03] dark:ring-white/[0.03]">
          <p className="text-muted-foreground text-sm">
            Your recent activity across modules will appear here as you start using CCD Suite.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
