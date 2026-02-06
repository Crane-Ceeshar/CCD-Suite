'use client';

import type React from 'react';
import { HeroSection } from './hero-section';
import { FeaturesSection } from './features-section';
import { ModulesSection } from './modules-section';
import { PricingSection } from './pricing-section';
import { TestimonialsSection } from './testimonials-section';
import { CTASection } from './cta-section';
import { LandingNav } from './landing-nav';
import { LandingFooter } from './landing-footer';

/**
 * Force light-mode CSS variable values so the marketing landing page
 * always renders correctly regardless of the user's global theme.
 * Dark mode is for the app dashboard, not the marketing site.
 */
const lightModeVars: React.CSSProperties = {
  '--background': '40 100% 95%',
  '--foreground': '220 20% 15%',
  '--card': '0 0% 100%',
  '--card-foreground': '220 20% 15%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '220 20% 15%',
  '--primary': '214 100% 33%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '74 63% 45%',
  '--secondary-foreground': '0 0% 100%',
  '--muted': '220 14% 96%',
  '--muted-foreground': '220 8% 46%',
  '--accent': '220 14% 96%',
  '--accent-foreground': '220 20% 15%',
  '--border': '220 13% 91%',
  '--input': '220 13% 91%',
  '--ring': '214 100% 33%',
} as React.CSSProperties;

export function LandingPage() {
  return (
    <div className="min-h-screen bg-ccd-cream" style={lightModeVars}>
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
