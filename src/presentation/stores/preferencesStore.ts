import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Language } from '../i18n/messages';

export type Theme = 'light' | 'dark';

interface PreferencesState {
  readonly theme: Theme;
  readonly language: Language;
  readonly toggleTheme: () => void;
  readonly toggleLanguage: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'fr',
      toggleTheme: () => {
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' }));
      },
      toggleLanguage: () => {
        set((state) => ({ language: state.language === 'fr' ? 'en' : 'fr' }));
      },
    }),
    { name: 'agitz.preferences', storage: createJSONStorage(() => localStorage) },
  ),
);
