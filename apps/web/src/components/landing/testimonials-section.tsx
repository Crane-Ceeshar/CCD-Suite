'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    quote: 'CCD Suite replaced 6 different tools we were paying for. Our team is more productive and our clients love the portal.',
    author: 'Sarah Mitchell',
    role: 'CEO, Bright Digital Agency',
    avatar: 'SM',
    rating: 5,
  },
  {
    quote: 'The AI features alone are worth the price. Content generation and predictive analytics have saved us dozens of hours each week.',
    author: 'James Cooper',
    role: 'Marketing Director, Scale Studios',
    avatar: 'JC',
    rating: 5,
  },
  {
    quote: 'Finally, a platform that understands how agencies actually work. The unified dashboard gives us complete visibility.',
    author: 'Amara Osei',
    role: 'Operations Manager, Nexus Creative',
    avatar: 'AO',
    rating: 5,
  },
];

export function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.015]">
        <svg viewBox="0 0 463.63 396.19" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-auto">
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
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-ccd-dark">
            Loved by Agencies
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="group relative p-8 rounded-2xl bg-ccd-cream/50 border border-border/30 hover:bg-white hover:shadow-xl transition-all duration-500"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star
                    key={si}
                    className="h-4 w-4 fill-ccd-lime text-ccd-lime"
                  />
                ))}
              </div>

              <blockquote className="text-foreground/70 leading-relaxed mb-8 text-[15px]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ccd-blue to-ccd-blue/70 flex items-center justify-center text-white text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ccd-dark">{t.author}</p>
                  <p className="text-xs text-foreground/50">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
