'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@ccd/ui';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl bg-ccd-blue overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full border border-white/5"
            />
            <motion.div
              animate={{ rotate: [360, 0] }}
              transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
              className="absolute -bottom-1/2 -left-1/4 w-[500px] h-[500px] rounded-full border border-white/5"
            />
            {/* CCD Pattern tiled overlay */}
            <div className="absolute inset-0 opacity-[0.04]">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <defs>
                  <pattern id="ccd-cta-pattern" x="0" y="0" width="288" height="246" patternUnits="userSpaceOnUse">
                    <path fill="#fff" d="M83.75,0L0,123l143.94-38.85-60.19-19.16V0Z"/>
                    <path fill="#fff" d="M204.13,123L287.87,0l-143.94,38.85,60.19,19.16v64.99Z"/>
                    <path fill="#fff" d="M60.19,246l83.75-123L0,161.85l60.19,19.16v64.99Z"/>
                    <path fill="#fff" d="M227.68,123l-83.75,123,143.94-38.85-60.19-19.16v-64.99Z"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#ccd-cta-pattern)" />
              </svg>
            </div>
          </div>

          <div className="relative px-8 py-16 lg:px-16 lg:py-24 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-white leading-tight"
            >
              Ready to Unify Your Agency?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-4 text-lg text-white/70 max-w-xl mx-auto"
            >
              Join hundreds of agencies already using CCD Suite to streamline operations,
              delight clients, and grow revenue.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-ccd-blue hover:bg-white/90 text-base px-8 py-6 shadow-xl hover:scale-105 transition-all duration-300 group"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="https://craneceeshar.com" target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 text-base px-8 py-6"
                >
                  Learn About Crane & Ceeshar
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
