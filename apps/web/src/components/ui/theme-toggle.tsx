'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@ccd/ui';
import { useUIStore } from '@/stores/ui-store';

const themes = ['light', 'dark', 'system'] as const;
const icons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};
const labels = {
  light: 'Switch to dark mode',
  dark: 'Switch to system mode',
  system: 'Switch to light mode',
};

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const cycle = () => {
    const idx = themes.indexOf(theme);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const Icon = icons[theme];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      className="relative h-9 w-9 rounded-full hover:bg-accent"
      aria-label={labels[theme]}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <Icon className="h-4 w-4" />
        </motion.div>
      </AnimatePresence>
    </Button>
  );
}
