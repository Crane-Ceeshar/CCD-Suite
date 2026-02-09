'use client';

import * as React from 'react';
import { useUIStore } from '@/stores/ui-store';

function applyTheme(theme: 'light' | 'dark' | 'night') {
  const root = document.documentElement;

  if (theme === 'light') {
    root.classList.remove('dark', 'night');
  } else if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('night');
  } else if (theme === 'night') {
    root.classList.add('dark', 'night');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme);

  // Apply theme on mount and when it changes
  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return <>{children}</>;
}
