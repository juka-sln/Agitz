import { create } from 'zustand';

interface EditorState {
  readonly isOpen: boolean;
  /** The file being edited, or `null` for the overview of the conflicts. */
  readonly path: string | null;
  readonly open: (path?: string | null) => void;
  readonly close: () => void;
  readonly toggle: () => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  isOpen: false,
  path: null,
  open: (path = null) => {
    set({ isOpen: true, path });
  },
  close: () => {
    set({ isOpen: false });
  },
  toggle: () => {
    set((state) => (state.isOpen ? { isOpen: false } : { isOpen: true, path: null }));
  },
}));
