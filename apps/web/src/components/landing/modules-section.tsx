'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import {
  Users,
  BarChart3,
  PenTool,
  Search,
  Share2,
  LayoutGrid,
  FolderKanban,
  Wallet,
  Building2,
} from 'lucide-react';

const modules = [
  {
    id: 'crm',
    name: 'CRM',
    tagline: 'Client Relationship Management',
    description: 'Track leads, manage deals, and nurture client relationships with an intelligent pipeline.',
    icon: Users,
    color: '#0047AB',
    features: ['Deal Pipeline', 'Contact Management', 'Activity Tracking', 'Revenue Forecasting'],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    tagline: 'Cross-Platform Insights',
    description: 'Unified dashboards pulling data from every module for actionable business intelligence.',
    icon: BarChart3,
    color: '#8B5CF6',
    features: ['Custom Dashboards', 'Real-time Metrics', 'Predictive Analytics', 'Export Reports'],
  },
  {
    id: 'content',
    name: 'Content',
    tagline: 'Content Creation & Scheduling',
    description: 'Plan, create, and schedule content across all channels with AI-assisted writing.',
    icon: PenTool,
    color: '#EC4899',
    features: ['Editorial Calendar', 'AI Writer', 'Asset Library', 'Approval Workflows'],
  },
  {
    id: 'seo',
    name: 'SEO',
    tagline: 'Search Engine Optimisation',
    description: 'Monitor rankings, audit sites, and optimise digital presence for maximum visibility.',
    icon: Search,
    color: '#9BBD2B',
    features: ['Rank Tracking', 'Site Audits', 'Keyword Research', 'Competitor Analysis'],
  },
  {
    id: 'social',
    name: 'Social Media',
    tagline: 'Social Account Management',
    description: 'Manage all social accounts, schedule posts, and monitor engagement in one place.',
    icon: Share2,
    color: '#F59E0B',
    features: ['Multi-Account', 'Post Scheduling', 'Engagement Analytics', 'Auto-Replies'],
  },
  {
    id: 'portal',
    name: 'Client Portal',
    tagline: 'External Collaboration',
    description: 'Give clients a branded portal to view progress, approve work, and communicate.',
    icon: LayoutGrid,
    color: '#06B6D4',
    features: ['Branded Portals', 'File Sharing', 'Approval System', 'Communication Hub'],
  },
  {
    id: 'projects',
    name: 'Projects',
    tagline: 'Task & Workflow Management',
    description: 'Kanban boards, Gantt charts, time tracking, and team coordination tools.',
    icon: FolderKanban,
    color: '#6366F1',
    features: ['Kanban Boards', 'Gantt Charts', 'Time Tracking', 'Sprint Planning'],
  },
  {
    id: 'finance',
    name: 'Finance',
    tagline: 'Invoicing & Financial Tracking',
    description: 'Create invoices, track expenses, and manage your agency finances effortlessly.',
    icon: Wallet,
    color: '#14B8A6',
    features: ['Invoicing', 'Expense Tracking', 'Revenue Reports', 'Tax Calculations'],
  },
  {
    id: 'hr',
    name: 'HR',
    tagline: 'People Management',
    description: 'Employee records, leave management, payroll, and team organisation.',
    icon: Building2,
    color: '#F97316',
    features: ['Employee Records', 'Leave Management', 'Payroll', 'Onboarding'],
  },
];

export function ModulesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [activeModule, setActiveModule] = useState(modules[0]);

  return (
    <section id="modules" className="py-24 lg:py-32 bg-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg viewBox="0 0 463.63 396.19" className="absolute top-0 left-0 w-[200px] h-auto rotate-12">
          <path fill="#194ca1" d="M193.88,186.84L0,125.13,463.63,0,193.88,396.19v-209.35Z"/>
        </svg>
        <svg viewBox="0 0 463.63 396.19" className="absolute bottom-0 right-0 w-[300px] h-auto -rotate-12">
          <path fill="#194ca1" d="M193.88,186.84L0,125.13,463.63,0,193.88,396.19v-209.35Z"/>
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex px-3 py-1 rounded-full bg-ccd-lime/10 text-sm font-medium text-ccd-dark mb-4">
            9 Powerful Modules
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-ccd-dark">
            One Platform, Every Tool
          </h2>
          <p className="mt-4 text-lg text-foreground/60 max-w-2xl mx-auto">
            Each module is purpose-built yet deeply integrated, creating a seamless workflow across your entire business.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">
          {/* Module selector tabs */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide"
          >
            {modules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left whitespace-nowrap lg:whitespace-normal transition-all duration-300 ${
                  activeModule.id === mod.id
                    ? 'bg-white shadow-lg scale-[1.02]'
                    : 'hover:bg-white/60'
                }`}
                style={
                  activeModule.id === mod.id
                    ? { borderLeft: `3px solid ${mod.color}` }
                    : { borderLeft: '3px solid transparent' }
                }
              >
                <div
                  className="p-2 rounded-lg shrink-0 transition-colors duration-300"
                  style={{
                    backgroundColor:
                      activeModule.id === mod.id ? `${mod.color}15` : 'transparent',
                  }}
                >
                  <mod.icon
                    className="h-4 w-4"
                    style={{
                      color:
                        activeModule.id === mod.id ? mod.color : '#94a3b8',
                    }}
                  />
                </div>
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    activeModule.id === mod.id ? 'text-foreground' : 'text-foreground/50'
                  }`}
                >
                  {mod.name}
                </span>
              </button>
            ))}
          </motion.div>

          {/* Active module detail */}
          <motion.div
            key={activeModule.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl bg-gradient-to-br from-white to-ccd-cream/30 border border-border/50 p-8 lg:p-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${activeModule.color}15` }}
              >
                <activeModule.icon
                  className="h-8 w-8"
                  style={{ color: activeModule.color }}
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold font-heading text-ccd-dark">
                  {activeModule.name}
                </h3>
                <p className="text-sm text-foreground/50">{activeModule.tagline}</p>
              </div>
            </div>

            <p className="text-foreground/70 text-lg leading-relaxed mb-8">
              {activeModule.description}
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {activeModule.features.map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/80"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: activeModule.color }}
                  />
                  <span className="text-sm font-medium text-foreground/70">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Module preview mock */}
            <div className="mt-8 rounded-xl overflow-hidden border bg-white/50">
              <div
                className="h-2 w-full"
                style={{ backgroundColor: activeModule.color }}
              />
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="flex items-center gap-4">
                    <div
                      className="w-8 h-8 rounded-lg shrink-0"
                      style={{ backgroundColor: `${activeModule.color}15` }}
                    />
                    <div className="flex-1 space-y-1.5">
                      <div
                        className="h-3 rounded-full"
                        style={{
                          width: `${60 + row * 10}%`,
                          backgroundColor: `${activeModule.color}12`,
                        }}
                      />
                      <div
                        className="h-2 rounded-full w-1/3"
                        style={{ backgroundColor: `${activeModule.color}08` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
