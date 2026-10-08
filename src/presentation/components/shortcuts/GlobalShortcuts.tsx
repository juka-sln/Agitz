import { useEffect } from 'react';

import { useSession } from '../../hooks/useSession';
import { useDocsStore } from '../../stores/docsStore';
import { useEditorStore } from '../../stores/editorStore';
import { useGitHubStore } from '../../stores/githubStore';
import { useMissionsStore } from '../../stores/missionsStore';
import { useShortcutsStore } from '../../stores/shortcutsStore';
import { TERMINAL_INPUT_ID } from '../layout/panelIds';

import { isEditable, matchGlobalShortcut, type GlobalShortcut } from './globalShortcuts';
import { ShortcutsDialog } from './ShortcutsDialog';

/** Listens to the keyboard on the whole page, whichever panel has focus. */
export function GlobalShortcuts() {
  const users = useSession((state) => state.users);
  const activeUserId = useSession((state) => state.activeUser.id);
  const switchUser = useSession((state) => state.switchUser);

  useEffect(() => {
    const perform = (shortcut: GlobalShortcut) => {
      switch (shortcut) {
        case 'focusTerminal':
          document.getElementById(TERMINAL_INPUT_ID)?.focus();
          return;
        case 'toggleDocs':
          useDocsStore.getState().toggle();
          return;
        case 'toggleGitHub':
          useGitHubStore.getState().toggle();
          return;
        case 'toggleEditor':
          useEditorStore.getState().toggle();
          return;
        case 'toggleMissions':
          useMissionsStore.getState().toggle();
          return;
        case 'nextUser': {
          const index = users.findIndex((user) => user.id === activeUserId);
          const next = users[(index + 1) % users.length];
          if (next !== undefined) {
            switchUser(next.id);
          }
          return;
        }
        case 'showShortcuts':
          useShortcutsStore.getState().open();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || useShortcutsStore.getState().isOpen) {
        return;
      }
      const shortcut = matchGlobalShortcut(event, isEditable(event.target));
      if (shortcut !== null) {
        event.preventDefault();
        perform(shortcut);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [users, activeUserId, switchUser]);

  return <ShortcutsDialog />;
}
