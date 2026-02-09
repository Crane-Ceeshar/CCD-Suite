import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  theme: 'light' | 'dark' | 'night';
  sidebarDensity: 'compact' | 'default';
  dateFormat: string;
  timeFormat: '12h' | '24h';
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setTheme: (theme: 'light' | 'dark' | 'night') => void;
  setSidebarDensity: (density: 'compact' | 'default') => void;
  setDateFormat: (format: string) => void;
  setTimeFormat: (format: '12h' | '24h') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      theme: 'dark',
      sidebarDensity: 'default',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
      toggleMobileMenu: () =>
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      setTheme: (theme) => set({ theme }),
      setSidebarDensity: (sidebarDensity) => set({ sidebarDensity }),
      setDateFormat: (dateFormat) => set({ dateFormat }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
    }),
    {
      name: 'ccd-ui-preferences',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        sidebarDensity: state.sidebarDensity,
        dateFormat: state.dateFormat,
        timeFormat: state.timeFormat,
      }),
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>;
        if (version === 0) {
          // Migrate 'system' theme to 'dark'
          if (state.theme === 'system') {
            state.theme = 'dark';
          }
        }
        return state as unknown as UIState;
      },
    }
  )
);
