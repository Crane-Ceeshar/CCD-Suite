'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@ccd/ui';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for small agencies getting started.',
    features: [
      'Up to 5 team members',
      'Choose any 3 modules',
      '1,000 contacts',
      '5 GB storage',
      'Email support',
      'Basic analytics',
    ],
    cta: 'Start Free Trial',
    href: '/register?plan=starter',
    popular: false,
  },
  {
    name: 'Professional',
    price: 59,
    description: 'For growing agencies that need the full suite.',
    features: [
      'Up to 25 team members',
      'All 9 modules included',
      '10,000 contacts',
      '50 GB storage',
      'Priority support',
      'Advanced analytics & AI',
      'Client portal access',
      'Custom branding',
    ],
    cta: 'Start Free Trial',
    href: '/register?plan=professional',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 99,
    description: 'For large agencies with advanced needs.',
    features: [
      'Unlimited team members',
      'All 9 modules + custom modules',
      'Unlimited contacts',
      '500 GB storage',
      'Dedicated account manager',
      'Full AI suite with custom models',
      'White-label & custom domains',
      'SSO & advanced security',
      'API access & webhooks',
    ],
    cta: 'Start Free Trial',
    href: '/register?plan=enterprise',
    popular: false,
  },
  {
    name: 'Custom',
    price: null,
    description: 'Build exactly the suite your agency needs.',
    features: [
      'Pick any number of modules',
      'Flexible team size',
      'Custom storage & contacts',
      'Priority support',
      'Custom integrations',
      'Tailored onboarding',
    ],
    cta: 'Start Free Trial',
    href: '/register?plan=custom',
    popular: false,
  },
];

export function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="pricing" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-ccd-cream/50 to-ccd-cream" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex px-3 py-1 rounded-full bg-ccd-blue/5 text-sm font-medium text-ccd-blue mb-4">
            Simple Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-ccd-dark">
            Plans for Every Agency
          </h2>
          <p className="mt-4 text-lg text-foreground/60 max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required. Scale as you grow.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`relative rounded-2xl p-6 lg:p-7 transition-all duration-500 flex flex-col ${
                plan.popular
                  ? 'bg-ccd-blue text-white shadow-2xl shadow-ccd-blue/25 lg:scale-[1.03] border-0'
                  : 'bg-white border border-border/50 hover:shadow-xl'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-ccd-lime text-white text-xs font-bold shadow-lg">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-5">
                <h3 className={`text-lg font-bold font-heading ${plan.popular ? 'text-white' : 'text-ccd-dark'}`}>
                  {plan.name}
                </h3>
                <p className={`mt-1 text-sm leading-relaxed ${plan.popular ? 'text-white/70' : 'text-foreground/50'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                {plan.price !== null ? (
                  <>
                    <span className={`text-3xl font-bold font-heading ${plan.popular ? 'text-white' : 'text-ccd-dark'}`}>
                      ${plan.price}
                    </span>
                    <span className={`text-sm ${plan.popular ? 'text-white/60' : 'text-foreground/40'}`}>
                      /user/month
                    </span>
                  </>
                ) : (
                  <span className={`text-3xl font-bold font-heading ${plan.popular ? 'text-white' : 'text-ccd-dark'}`}>
                    Custom
                  </span>
                )}
              </div>

              <ul className="space-y-2.5 mb-7 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className="h-4 w-4 mt-0.5 shrink-0 text-ccd-lime"
                    />
                    <span className={`text-sm ${plan.popular ? 'text-white/80' : 'text-foreground/60'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href}>
                <Button
                  className={`w-full group ${
                    plan.popular
                      ? 'bg-white text-ccd-blue hover:bg-white/90'
                      : 'bg-ccd-blue text-white hover:bg-ccd-blue/90'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
