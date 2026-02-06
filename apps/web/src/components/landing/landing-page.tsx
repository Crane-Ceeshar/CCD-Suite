'use client';

import { HeroSection } from './hero-section';
import { FeaturesSection } from './features-section';
import { ModulesSection } from './modules-section';
import { PricingSection } from './pricing-section';
import { TestimonialsSection } from './testimonials-section';
import { CTASection } from './cta-section';
import { LandingNav } from './landing-nav';
import { LandingFooter } from './landing-footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-ccd-cream">
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ModulesSection />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
