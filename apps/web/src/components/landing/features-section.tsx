'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Layers,
  Brain,
  Shield,
  Zap,
  Globe,
  Users,
} from 'lucide-react';

const features = [
  {
    icon: Layers,
    title: '9 Modules, One Platform',
    description: 'CRM, Analytics, Content, SEO, Social, Client Portal, Projects, Finance, and HR — all deeply integrated.',
    color: '#194ca1',
  },
  {
    icon: Brain,
    title: 'AI at the Core',
    description: 'Intelligent automation, predictive insights, and content generation powered by cutting-edge AI models.',
    color: '#8B5CF6',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Multi-tenant architecture with Row-Level Security, JWT auth, and SOC 2 compliance-ready infrastructure.',
    color: '#14B8A6',
  },
  {
    icon: Zap,
    title: 'Blazing Fast',
    description: 'Built with Rust for performance-critical paths. Real-time updates and sub-100ms API responses.',
    color: '#F59E0B',
  },
  {
    icon: Globe,
    title: 'White-Label Ready',
    description: 'Full customisation with custom domains, branding, and theming for each tenant.',
    color: '#EC4899',
  },
  {
    icon: Users,
    title: 'User-Type Access',
    description: 'Pre-defined user types (Admin, Sales, Marketing, PM, Finance, HR, Client) with intelligent permissions.',
    color: '#6366F1',
  },
];

export function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" className="py-24 lg:py-32 relative">
      {/* Section background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <span className="inline-flex px-3 py-1 rounded-full bg-ccd-blue/5 text-sm font-medium text-ccd-blue mb-4">
            Why CCD Suite
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-ccd-dark">
            Built for Modern Agencies
          </h2>
          <p className="mt-4 text-lg text-foreground/60 max-w-2xl mx-auto">
            A unified platform designed from the ground up to replace your fragmented tech stack.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="group relative p-6 lg:p-8 rounded-2xl bg-white border border-border/50 hover:border-transparent hover:shadow-xl transition-all duration-500"
            >
              {/* Hover gradient border effect */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                style={{
                  background: `linear-gradient(135deg, ${feature.color}15, transparent, ${feature.color}10)`,
                }}
              />

              <div
                className="inline-flex p-3 rounded-xl mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${feature.color}10` }}
              >
                <feature.icon
                  className="h-6 w-6"
                  style={{ color: feature.color }}
                />
              </div>

              <h3 className="text-lg font-semibold text-ccd-dark mb-2">
                {feature.title}
              </h3>
              <p className="text-foreground/60 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
