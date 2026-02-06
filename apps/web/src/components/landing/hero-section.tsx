'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@ccd/ui';
import { ArrowRight, Play, Sparkles } from 'lucide-react';

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
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large gradient orbs */}
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-ccd-blue/5 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-ccd-lime/10 blur-3xl"
        />

        {/* Floating module color dots */}
        {moduleColors.map((mod, i) => (
          <motion.div
            key={mod.label}
            className="absolute rounded-full opacity-20"
            style={{
              backgroundColor: mod.color,
              width: 8 + Math.random() * 16,
              height: 8 + Math.random() * 16,
              left: `${10 + (i * 10)}%`,
              top: `${20 + Math.sin(i) * 30}%`,
            }}
            animate={{
              y: [0, -30 - i * 5, 0],
              x: [0, 10 * Math.sin(i), 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* CCD Pattern watermark */}
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] opacity-[0.03]">
          <svg viewBox="0 0 463.63 396.19" className="w-full h-full">
            <path fill="#194ca1" d="M193.88,186.84L0,125.13,463.63,0,193.88,396.19v-209.35Z"/>
          </svg>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ccd-blue/5 border border-ccd-blue/10 text-sm font-medium text-ccd-blue">
              <Sparkles className="h-4 w-4" />
              AI-Powered Business Management
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute h-2 w-2 rounded-full bg-ccd-lime opacity-75" />
                <span className="relative rounded-full h-2 w-2 bg-ccd-lime" />
              </span>
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold font-heading tracking-tight text-ccd-dark leading-[1.1]"
          >
            Everything Your Agency{' '}
            <span className="relative">
              <span className="relative z-10 text-ccd-blue">Needs</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-2 left-0 right-0 h-3 bg-ccd-lime/30 -z-0 origin-left rounded"
              />
            </span>
            {', '}
            <br className="hidden sm:block" />
            in One Suite
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mt-6 text-lg sm:text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed"
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
                className="bg-ccd-blue hover:bg-ccd-blue/90 text-white text-base px-8 py-6 shadow-xl shadow-ccd-blue/25 hover:shadow-ccd-blue/40 transition-all duration-300 hover:scale-105 group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="text-base px-8 py-6 border-foreground/20 hover:border-ccd-blue/30 hover:bg-ccd-blue/5 transition-all duration-300"
            >
              <Play className="mr-2 h-4 w-4 fill-current" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            variants={itemVariants}
            className="mt-16 flex flex-col items-center gap-4"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-ccd-blue/20 to-ccd-blue/40 flex items-center justify-center text-xs font-bold text-ccd-blue"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-foreground/50">
              Trusted by <span className="font-semibold text-foreground/70">500+</span> agencies worldwide
            </p>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview Mock */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 lg:mt-24 relative mx-auto max-w-5xl"
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
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 1.2 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
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
  );
}
