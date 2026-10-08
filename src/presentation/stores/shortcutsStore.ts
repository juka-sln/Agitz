import { create } from 'zustand';

interface ShortcutsState {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
}

/** The list of keyboard shortcuts, opened from the header or with `?`. */
export const useShortcutsStore = create<ShortcutsState>()((set) => ({
  isOpen: false,
  open: () => {
    set({ isOpen: true });
  },
  close: () => {
    set({ isOpen: false });
  },
}));
