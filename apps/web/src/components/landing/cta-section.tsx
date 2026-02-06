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
            {/* Pattern overlay */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
              <svg viewBox="0 0 525 448.86" className="w-full h-full">
                <path fill="#fff" d="M525,0l-210.32,140.44c-9.99.44-19.05-2.32-29.3-2.4-46.8-.26-88.04,18.28-117.71,47.65L0,142.58,525,0h0Z"/>
                <polygon fill="#fff" points="525 0 219.53 448.86 235.08 253.87 525 0"/>
                <path fill="#fff" d="M274.44,177.18c-10.5,8.7-22.66,19.13-34.68,27.38h0c-.88.63-1.73,1.22-2.65,1.81-8.18,5.27-19.38,9.1-22.26-3.91-.26-1.14-.41-2.28-.48-3.35-.88-14.59,13.52-26.75,26.79-29.92,10.1-2.43,23.03-.66,31.29,5.86.52.41,1.47,1.51,1.99,2.14h0Z"/>
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
