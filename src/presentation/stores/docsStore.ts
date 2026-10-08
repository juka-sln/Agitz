import { create } from 'zustand';

interface DocsState {
  readonly isOpen: boolean;
  /** Pages visited since the panel was opened; `null` stands for the table of contents. */
  readonly history: readonly (string | null)[];
  readonly open: (pageId?: string | null) => void;
  readonly back: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
}

export const useDocsStore = create<DocsState>()((set) => ({
  isOpen: false,
  history: [null],
  open: (pageId = null) => {
    set((state) =>
      state.isOpen
        ? { history: state.history.at(-1) === pageId ? state.history : [...state.history, pageId] }
        : { isOpen: true, history: [pageId] },
    );
  },
  back: () => {
    set((state) => ({
      history: state.history.length > 1 ? state.history.slice(0, -1) : state.history,
    }));
  },
  close: () => {
    set({ isOpen: false });
  },
  toggle: () => {
    set((state) => (state.isOpen ? { isOpen: false } : { isOpen: true, history: [null] }));
  },
}));

export function selectCurrentPage(state: Pick<DocsState, 'history'>): string | null {
  return state.history.at(-1) ?? null;
}
