import { useEffect } from 'react';

import { DocsPanel } from './components/docs/DocsPanel';
import { FileExplorer } from './components/files/FileExplorer';
import { GitHubPanel } from './components/github/GitHubPanel';
import { CommitGraphView } from './components/graph/CommitGraphView';
import { AppHeader } from './components/layout/AppHeader';
import { HostedRepositories } from './components/team/HostedRepositories';
import { UserSwitcher } from './components/team/UserSwitcher';
import { Terminal } from './components/terminal/Terminal';
import { useDocsStore } from './stores/docsStore';
import { useGitHubStore } from './stores/githubStore';
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

/** The documentation and GitHub share the right side: opening one closes the other. */
function useExclusiveSidePanels() {
  useEffect(() => {
    const stopDocs = useDocsStore.subscribe((state, previous) => {
      if (state.isOpen && !previous.isOpen) {
        useGitHubStore.getState().close();
      }
    });
    const stopGitHub = useGitHubStore.subscribe((state, previous) => {
      if (state.isOpen && !previous.isOpen) {
        useDocsStore.getState().close();
      }
    });
    return () => {
      stopDocs();
      stopGitHub();
    };
  }, []);
}

export function App({ store }: { store: SessionStore }) {
  useDocumentPreferences();
  useExclusiveSidePanels();

  return (
    <SessionProvider store={store}>
      <div className="bg-canvas text-ink grid h-full grid-rows-[auto_1fr]">
        <AppHeader />
        <div className="grid min-h-0 grid-cols-1 md:grid-cols-[15rem_1fr]">
          <aside className="border-rule bg-surface order-last flex max-h-72 min-h-0 flex-col overflow-y-auto border-t md:order-first md:max-h-none md:border-t-0 md:border-r">
            <UserSwitcher />
            <FileExplorer />
            <HostedRepositories />
          </aside>
          <main className="relative grid min-h-0 grid-rows-[minmax(16rem,1fr)_minmax(14rem,40%)]">
            <section className="relative min-h-0">
              <CommitGraphView />
            </section>
            <section className="border-rule min-h-0 border-t">
              <Terminal />
            </section>
            <DocsPanel />
            <GitHubPanel />
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
