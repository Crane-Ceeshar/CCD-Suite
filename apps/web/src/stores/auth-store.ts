import { create } from 'zustand';
import type { User, Session } from '@ccd/shared';
import type { ModuleId } from '@ccd/shared';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  allowedModules: ModuleId[];
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setAllowedModules: (modules: ModuleId[]) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  allowedModules: [],
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  setAllowedModules: (allowedModules) => set({ allowedModules }),
  reset: () =>
    set({
      user: null,
      session: null,
      isLoading: false,
      allowedModules: [],
    }),
}));
