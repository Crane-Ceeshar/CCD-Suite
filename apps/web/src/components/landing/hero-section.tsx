'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@ccd/ui';
import { ArrowRight, Play, Sparkles, ChevronDown } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const moduleColors = [
  { color: '#0047AB', label: 'CRM' },
  { color: '#8B5CF6', label: 'Analytics' },
  { color: '#EC4899', label: 'Content' },
  { color: '#9BBD2B', label: 'SEO' },
  { color: '#F59E0B', label: 'Social' },
  { color: '#06B6D4', label: 'Portal' },
  { color: '#6366F1', label: 'Projects' },
  { color: '#14B8A6', label: 'Finance' },
  { color: '#F97316', label: 'HR' },
];

export function HeroSection() {
  return (
    <>
      {/* Full-viewport Hero with pattern background */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-ccd-dark via-[#0f1a35] to-[#0a1628]" />

        {/* CCD Pattern tile background */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <pattern id="ccd-hero-pattern" x="0" y="0" width="288" height="246" patternUnits="userSpaceOnUse">
                <path fill="#fff" d="M83.75,0L0,123l143.94-38.85-60.19-19.16V0Z"/>
                <path fill="#fff" d="M204.13,123L287.87,0l-143.94,38.85,60.19,19.16v64.99Z"/>
                <path fill="#fff" d="M60.19,246l83.75-123L0,161.85l60.19,19.16v64.99Z"/>
                <path fill="#fff" d="M227.68,123l-83.75,123,143.94-38.85-60.19-19.16v-64.99Z"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ccd-hero-pattern)" />
          </svg>
        </div>

        {/* Animated color gradient orbs */}
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-ccd-blue/10 blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-1/4 -left-32 w-[400px] h-[400px] rounded-full bg-ccd-lime/10 blur-[100px]"
        />

        {/* Module color accent bar at bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 h-1 flex">
          {moduleColors.map((mod) => (
            <div key={mod.label} className="flex-1" style={{ backgroundColor: mod.color }} />
          ))}
        </div>

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Large CCD logo */}
            <motion.div variants={itemVariants} className="mb-10 flex justify-center">
              <Image
                src="/logos/logo-lockup-light.svg"
                alt="CCD Suite"
                width={320}
                height={84}
                className="h-16 sm:h-20 lg:h-24 w-auto"
                priority
              />
            </motion.div>

            {/* Badge */}
            <motion.div variants={itemVariants} className="mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-ccd-cream/80 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-ccd-lime" />
                AI-Powered Business Management
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute h-2 w-2 rounded-full bg-ccd-lime opacity-75" />
                  <span className="relative rounded-full h-2 w-2 bg-ccd-lime" />
                </span>
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold font-heading tracking-tight text-white leading-[1.1]"
            >
              Everything Your Agency{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-ccd-lime">Needs</span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute bottom-1 sm:bottom-2 left-0 right-0 h-2 sm:h-3 bg-ccd-lime/20 -z-0 origin-left rounded"
                />
              </span>
              {', '}
              <br className="hidden sm:block" />
              in One Suite
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="mt-6 text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed"
            >
              9 powerful modules. One unified platform. CCD Suite brings CRM, analytics,
              content, projects, finance, and more together with AI at the core.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-ccd-blue hover:bg-ccd-blue/90 text-white text-base px-8 py-6 shadow-xl shadow-ccd-blue/30 hover:shadow-ccd-blue/50 transition-all duration-300 hover:scale-105 group"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-6 border-white/20 text-white hover:border-white/40 hover:bg-white/5 transition-all duration-300"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              variants={itemVariants}
              className="mt-14 flex flex-col items-center gap-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-ccd-dark bg-gradient-to-br from-ccd-blue/30 to-ccd-blue/60 flex items-center justify-center text-xs font-bold text-white/80"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/40">
                Trusted by <span className="font-semibold text-white/60">500+</span> agencies worldwide
              </p>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-16"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-xs text-white/30 tracking-wider uppercase">Explore</span>
              <ChevronDown className="h-5 w-5 text-white/30" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Section — below the hero */}
      <section className="relative py-20 lg:py-32 bg-ccd-cream overflow-hidden">
        {/* Subtle pattern bg */}
        <div className="absolute inset-0 opacity-[0.015]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <pattern id="ccd-preview-pattern" x="0" y="0" width="288" height="246" patternUnits="userSpaceOnUse">
                <path fill="#194ca1" d="M83.75,0L0,123l143.94-38.85-60.19-19.16V0Z"/>
                <path fill="#194ca1" d="M204.13,123L287.87,0l-143.94,38.85,60.19,19.16v64.99Z"/>
                <path fill="#194ca1" d="M60.19,246l83.75-123L0,161.85l60.19,19.16v64.99Z"/>
                <path fill="#194ca1" d="M227.68,123l-83.75,123,143.94-38.85-60.19-19.16v-64.99Z"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ccd-preview-pattern)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 lg:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-ccd-dark">
              Your command centre, <span className="text-ccd-blue">unified</span>
            </h2>
            <p className="mt-4 text-lg text-foreground/50 max-w-2xl mx-auto">
              Every module, every metric, every client — all accessible from a single, beautifully designed dashboard.
            </p>
          </motion.div>

          {/* Dashboard Preview Mock */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto max-w-5xl"
          >
            <div className="relative rounded-xl lg:rounded-2xl overflow-hidden bg-white shadow-2xl shadow-ccd-blue/10 border border-border/50">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground">
                    app.ccdsuite.com
                  </div>
                </div>
              </div>

              {/* Dashboard mock content */}
              <div className="p-6 lg:p-8 bg-gradient-to-br from-ccd-cream/50 to-white">
                <div className="flex gap-4 mb-6">
                  {/* Sidebar mock */}
                  <div className="hidden lg:flex flex-col gap-2 w-48 shrink-0">
                    {moduleColors.slice(0, 6).map((mod) => (
                      <div
                        key={mod.label}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
                        style={{ backgroundColor: `${mod.color}10` }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: mod.color }}
                        />
                        <span className="text-foreground/70">{mod.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Main content mock */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {['Revenue', 'Clients', 'Projects', 'Tasks'].map((label, i) => (
                        <div
                          key={label}
                          className="p-4 rounded-lg bg-white shadow-sm border"
                        >
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-lg font-bold mt-1" style={{ color: moduleColors[i].color }}>
                            {['$48.2K', '124', '18', '67'][i]}
                          </p>
                        </div>
                      ))}
                    </div>
                    {/* Chart placeholder */}
                    <div className="h-32 lg:h-48 rounded-lg bg-gradient-to-r from-ccd-blue/5 to-ccd-lime/5 border flex items-end justify-around px-4 pb-4">
                      {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
                          className="w-full max-w-[24px] rounded-t"
                          style={{
                            backgroundColor: i % 2 === 0 ? '#194ca1' : '#5eb342',
                            opacity: 0.6 + (h / 100) * 0.4,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glow effect behind the card */}
            <div className="absolute -inset-4 bg-gradient-to-r from-ccd-blue/10 via-ccd-lime/10 to-ccd-blue/10 rounded-3xl blur-2xl -z-10 animate-pulse-glow" />
          </motion.div>
        </div>
      </section>
    </>
  );
}
