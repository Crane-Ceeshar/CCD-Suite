'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@ccd/ui';
import { ArrowRight, Play, Sparkles, ChevronDown } from 'lucide-react';

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

const contentContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const contentItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

/* ============================================================
   SECTION 1: Animated Logo Assembly Hero
   ============================================================ */
function LogoHero() {
  return (
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

      {/* Module color accent bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 flex">
        {moduleColors.map((mod) => (
          <div key={mod.label} className="flex-1" style={{ backgroundColor: mod.color }} />
        ))}
      </div>

      {/* Animated Logo + tagline */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4">
        {/* Logo container with continuous floating after assembly */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
        >
          <svg
            viewBox="0 0 868.94 227.82"
            className="w-[280px] sm:w-[400px] md:w-[520px] lg:w-[660px] xl:w-[760px] h-auto"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="CCD Suite"
          >
            {/* Arrow mark — swoops in from top-right */}
            <motion.g
              initial={{ x: 200, y: -200, rotate: 45, opacity: 0 }}
              animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 1, type: 'spring', stiffness: 60, damping: 14 }}
            >
              <path fill="#fff7e3" d="M577.38,0l-85.76,57.27c-4.07.18-7.77-.95-11.95-.98-19.09-.11-35.9,7.45-48,19.43l-68.38-17.58L577.38,0h0Z"/>
              <polygon fill="#fff7e3" points="577.38 0 452.81 183.04 459.15 103.51 577.38 0"/>
              <path fill="#fff7e3" d="M475.2,72.25c-4.28,3.55-9.24,7.8-14.14,11.17h0c-.36.26-.71.5-1.08.74-3.34,2.15-7.9,3.71-9.08-1.59-.11-.47-.17-.93-.2-1.37-.36-5.95,5.52-10.91,10.93-12.2,4.12-.99,9.39-.27,12.76,2.39.21.17.6.62.81.87h0Z"/>
            </motion.g>

            {/* "CCD" letters — slides in from the left */}
            <motion.g
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.9, type: 'spring', stiffness: 50, damping: 16 }}
            >
              <path fill="#fff7e3" d="M.02,157.22C.02,118.25,31.47,86.41,70.42,86.41c28.67,0,52.01,17.4,63.09,42.12l-25.32,7.32c-7.12-14.04-20.17-24.13-37.78-24.13-25.32,0-43.91,20.17-43.91,45.49s18.59,45.29,43.91,45.29c17.6,0,30.27-9.09,37.18-23.34l25.71,6.93c-10.88,24.53-34.02,41.73-62.89,41.73C31.44,227.82,0,196.17,0,157.22h.02Z"/>
              <path fill="#fff7e3" d="M144.39,157.22c0-38.97,31.45-70.81,70.4-70.81,28.67,0,52.01,17.4,63.09,42.12l-25.32,7.32c-7.12-14.04-20.17-24.13-37.78-24.13-25.32,0-43.91,20.17-43.91,45.49s18.59,45.29,43.91,45.29c17.6,0,30.27-9.09,37.18-23.34l25.71,6.93c-10.88,24.53-34.02,41.73-62.89,41.73-38.97,0-70.4-31.65-70.4-70.6h.02Z"/>
              <path fill="#fff7e3" d="M294.29,226.63V87.79h50.82c39.36,0,70.81,30.27,71.01,69.41.2,39.16-31.05,69.41-71.01,69.41h-50.82v.02ZM321.19,201.72h23.92c26.9,0,44.89-19.39,44.89-44.5s-18.2-44.5-44.89-44.5h-23.92v88.99h0Z"/>
            </motion.g>

            {/* "SUITE" letters — slides in from the right */}
            <motion.g
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.9, type: 'spring', stiffness: 50, damping: 16 }}
            >
              <path fill="#fff7e3" d="M523.83,188.3l2.37-11.75c8.63,9.87,19.61,15.12,31.48,15.12,10.74,0,21.87-4.49,23.61-13.87,1.5-7.99-4.37-12.74-22.12-17-19.37-4.75-28.49-11-25.98-23.86,3.13-15.87,21.23-24.62,37.61-24.62,15.12,0,24.62,6.12,29.36,10.62l-2.25,11.75c-7-7-17.75-12.11-29.24-12.11-10.49,0-22.74,4.75-24.62,14.37-1.88,9.24,9.62,11.99,23.86,15.37,21.37,5.24,26.36,14.25,24.24,25.23-3.25,16.74-20.87,24.62-37.24,24.36-13.24-.12-23.37-5-31.11-13.62h.02Z"/>
              <path fill="#fff7e3" d="M606.05,165.42l10.11-51.98h11l-10.11,51.98c-3.37,17.49,7.75,26.12,19.99,26.12s26.73-8.63,30.12-26.12l10.11-51.98h10.86l-10.11,51.98c-4.49,23.37-23.86,36.49-43.11,36.49s-33.48-12.74-28.87-36.49h.01Z"/>
              <path fill="#fff7e3" d="M686.15,200.9l17-87.46h11l-17,87.46h-11Z"/>
              <path fill="#fff7e3" d="M739.25,200.9l15-77.21h-29.86l2-10.25h69.73l-2,10.25h-28.99l-15,77.21h-10.88Z"/>
              <path fill="#fff7e3" d="M790.6,200.9l17-87.46h61.34l-2,10.11h-50.36l-5.62,28.61h45.35l-1.88,9.87h-45.35l-5.5,28.61h50.36l-2,10.25h-61.34Z"/>
            </motion.g>
          </svg>
        </motion.div>

        {/* Tagline — fades in after logo assembles */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="mt-8 text-base sm:text-lg text-white/40 tracking-wide text-center"
        >
          AI-Powered Business Management Suite
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="mt-16"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-xs text-white/30 tracking-wider uppercase">Discover</span>
            <ChevronDown className="h-5 w-5 text-white/30" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 2: Content Section (pushed down from hero)
   ============================================================ */
function ContentSection() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Light gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-ccd-cream/50 to-ccd-cream" />

      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <pattern id="ccd-content-pattern" x="0" y="0" width="288" height="246" patternUnits="userSpaceOnUse">
              <path fill="#194ca1" d="M83.75,0L0,123l143.94-38.85-60.19-19.16V0Z"/>
              <path fill="#194ca1" d="M204.13,123L287.87,0l-143.94,38.85,60.19,19.16v64.99Z"/>
              <path fill="#194ca1" d="M60.19,246l83.75-123L0,161.85l60.19,19.16v64.99Z"/>
              <path fill="#194ca1" d="M227.68,123l-83.75,123,143.94-38.85-60.19-19.16v-64.99Z"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ccd-content-pattern)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={contentContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {/* Badge */}
          <motion.div variants={contentItemVariants} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ccd-blue/5 border border-ccd-blue/15 text-sm font-medium text-ccd-blue backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-ccd-lime" />
              9 Integrated Modules
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute h-2 w-2 rounded-full bg-ccd-lime opacity-75" />
                <span className="relative rounded-full h-2 w-2 bg-ccd-lime" />
              </span>
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={contentItemVariants}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold font-heading tracking-tight text-ccd-dark leading-[1.1]"
          >
            Everything Your Agency{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-ccd-blue">Needs</span>
              <motion.span
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-1 sm:bottom-2 left-0 right-0 h-2 sm:h-3 bg-ccd-blue/20 -z-0 origin-left rounded"
              />
            </span>
            {', '}
            <br className="hidden sm:block" />
            in One Suite
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={contentItemVariants}
            className="mt-6 text-lg sm:text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed"
          >
            9 powerful modules. One unified platform. CCD Suite brings CRM, analytics,
            content, projects, finance, and more together with AI at the core.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={contentItemVariants}
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
              className="text-base px-8 py-6 border-2 border-ccd-blue/30 text-ccd-blue hover:border-ccd-blue/50 hover:bg-ccd-blue/5 transition-all duration-300"
            >
              <Play className="mr-2 h-4 w-4 fill-current" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            variants={contentItemVariants}
            className="mt-14 flex flex-col items-center gap-4"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-ccd-blue/30 to-ccd-blue/60 flex items-center justify-center text-xs font-bold text-white/80"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-foreground/40">
              Trusted by <span className="font-semibold text-foreground/60">500+</span> agencies worldwide
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 3: Dashboard Preview (unchanged)
   ============================================================ */
function DashboardPreview() {
  return (
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

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-5xl"
        >
          <div className="relative rounded-xl lg:rounded-2xl overflow-hidden bg-white shadow-2xl shadow-ccd-blue/10 border border-border/50">
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

            <div className="p-6 lg:p-8 bg-gradient-to-br from-ccd-cream/50 to-white">
              <div className="flex gap-4 mb-6">
                <div className="hidden lg:flex flex-col gap-2 w-48 shrink-0">
                  {moduleColors.slice(0, 6).map((mod) => (
                    <div
                      key={mod.label}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
                      style={{ backgroundColor: `${mod.color}10` }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mod.color }} />
                      <span className="text-foreground/70">{mod.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {['Revenue', 'Clients', 'Projects', 'Tasks'].map((label, i) => (
                      <div key={label} className="p-4 rounded-lg bg-white shadow-sm border">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-lg font-bold mt-1" style={{ color: moduleColors[i].color }}>
                          {['$48.2K', '124', '18', '67'][i]}
                        </p>
                      </div>
                    ))}
                  </div>
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

          <div className="absolute -inset-4 bg-gradient-to-r from-ccd-blue/10 via-ccd-lime/10 to-ccd-blue/10 rounded-3xl blur-2xl -z-10 animate-pulse-glow" />
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   EXPORTED COMPONENT
   ============================================================ */
export function HeroSection() {
  return (
    <>
      <LogoHero />
      <ContentSection />
      <DashboardPreview />
    </>
  );
}
