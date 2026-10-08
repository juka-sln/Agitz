import { create } from 'zustand';

import type { MissionId } from '@/application/learning/missions';

interface MissionsPanelState {
  readonly isOpen: boolean;
  /** The mission shown in detail, `null` for the first one left to do. */
  readonly selected: MissionId | null;
  readonly open: (mission?: MissionId | null) => void;
  readonly select: (mission: MissionId | null) => void;
  readonly close: () => void;
  readonly toggle: () => void;
}

export const useMissionsStore = create<MissionsPanelState>()((set) => ({
  isOpen: false,
  selected: null,
  open: (mission = null) => {
    set({ isOpen: true, selected: mission });
  },
  select: (mission) => {
    set({ selected: mission });
  },
  close: () => {
    set({ isOpen: false });
  },
  toggle: () => {
    set((state) => (state.isOpen ? { isOpen: false } : { isOpen: true, selected: null }));
  },
}));
