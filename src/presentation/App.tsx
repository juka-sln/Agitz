import { useEffect } from 'react';

import { FileExplorer } from './components/files/FileExplorer';
import { CommitGraphView } from './components/graph/CommitGraphView';
import { AppHeader } from './components/layout/AppHeader';
import { Terminal } from './components/terminal/Terminal';
import { usePreferencesStore } from './stores/preferencesStore';
import { SessionProvider } from './stores/SessionProvider';
import type { SessionStore } from './stores/sessionStore';

function useDocumentPreferences() {
  const theme = usePreferencesStore((state) => state.theme);
  const language = usePreferencesStore((state) => state.language);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.lang = language;
  }, [theme, language]);
}

export function App({ store }: { store: SessionStore }) {
  useDocumentPreferences();

  return (
    <SessionProvider store={store}>
      <div className="bg-canvas text-ink grid h-full grid-rows-[auto_1fr]">
        <AppHeader />
        <div className="grid min-h-0 grid-cols-1 md:grid-cols-[15rem_1fr]">
          <aside className="border-rule bg-surface order-last max-h-56 min-h-0 border-t md:order-first md:max-h-none md:border-t-0 md:border-r">
            <FileExplorer />
          </aside>
          <main className="grid min-h-0 grid-rows-[minmax(16rem,1fr)_minmax(14rem,40%)]">
            <section className="relative min-h-0">
              <CommitGraphView />
            </section>
            <section className="border-rule min-h-0 border-t">
              <Terminal />
            </section>
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
