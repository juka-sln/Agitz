import { useEffect } from 'react';

import { DocsPanel } from './components/docs/DocsPanel';
import { EditorPanel } from './components/editor/EditorPanel';
import { FileExplorer } from './components/files/FileExplorer';
import { GitHubPanel } from './components/github/GitHubPanel';
import { CommitGraphView } from './components/graph/CommitGraphView';
import { AppHeader } from './components/layout/AppHeader';
import { HostedRepositories } from './components/team/HostedRepositories';
import { RestartSession } from './components/team/RestartSession';
import { UserSwitcher } from './components/team/UserSwitcher';
import { Terminal } from './components/terminal/Terminal';
import { useDocsStore } from './stores/docsStore';
import { useEditorStore } from './stores/editorStore';
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

interface SidePanelState {
  readonly isOpen: boolean;
  readonly close: () => void;
}

interface SidePanelStore {
  readonly getState: () => SidePanelState;
  readonly subscribe: (
    listener: (state: SidePanelState, previous: SidePanelState) => void,
  ) => () => void;
}

/** The documentation, GitHub and the editor share the right side: opening one closes the others. */
function useExclusiveSidePanels() {
  useEffect(() => {
    const panels: readonly SidePanelStore[] = [useDocsStore, useGitHubStore, useEditorStore];
    const stops = panels.map((panel) =>
      panel.subscribe((state, previous) => {
        if (state.isOpen && !previous.isOpen) {
          panels
            .filter((other) => other !== panel)
            .forEach((other) => {
              other.getState().close();
            });
        }
      }),
    );
    return () => {
      stops.forEach((stop) => {
        stop();
      });
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
            <RestartSession />
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
            <EditorPanel />
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
