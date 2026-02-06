import { create } from 'zustand';
import type { ModuleId } from '@ccd/shared';

interface ModuleState {
  activeModule: ModuleId | null;
  setActiveModule: (moduleId: ModuleId | null) => void;
}

export const useModuleStore = create<ModuleState>((set) => ({
  activeModule: null,
  setActiveModule: (activeModule) => set({ activeModule }),
}));
