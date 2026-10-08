import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { App } from '@/presentation/App';
import { useDocsStore } from '@/presentation/stores/docsStore';
import { useGitHubStore } from '@/presentation/stores/githubStore';
import { useShortcutsStore } from '@/presentation/stores/shortcutsStore';
import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

function renderApp() {
  const store = createTestSessionStore();
  render(<App store={store} />);
  return store;
}

describe('GlobalShortcuts', () => {
  afterEach(() => {
    act(() => {
      useDocsStore.getState().close();
      useGitHubStore.getState().close();
      useShortcutsStore.getState().close();
    });
  });

  it('toggles the side panels from anywhere, even while typing a command', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.keyboard('{Alt>}{Shift>}D{/Shift}{/Alt}');
    expect(useDocsStore.getState().isOpen).toBe(true);

    await user.keyboard('{Alt>}{Shift>}G{/Shift}{/Alt}');
    expect(useGitHubStore.getState().isOpen).toBe(true);
    expect(useDocsStore.getState().isOpen).toBe(false);
  });

  it('switches to the next teammate, then back to the first one', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await user.keyboard('{Alt>}{Shift>}U{/Shift}{/Alt}');
    expect(store.getState().activeUser.id).toBe('bob');

    await user.keyboard('{Alt>}{Shift>}U{/Shift}{/Alt}');
    expect(store.getState().activeUser.id).toBe('alice');
  });

  it('brings focus back to the terminal', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Tout recommencer' }));

    await user.keyboard('{Alt>}{Shift>}T{/Shift}{/Alt}');
    expect(screen.getByRole('textbox', { name: 'Commande' })).toHaveFocus();
  });

  it('lists the shortcuts with ? outside text fields only', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.keyboard('?');
    expect(useShortcutsStore.getState().isOpen).toBe(false);
    expect(screen.getByRole('textbox', { name: 'Commande' })).toHaveValue('?');

    await user.click(screen.getByRole('button', { name: 'Raccourcis clavier' }));
    const dialog = screen.getByRole('dialog', { name: 'Raccourcis clavier' });
    expect(dialog).toHaveTextContent('Ouvrir ou fermer la documentation');
    expect(dialog).toHaveTextContent('Maj');

    await user.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(useShortcutsStore.getState().isOpen).toBe(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.keyboard('?');
    expect(useShortcutsStore.getState().isOpen).toBe(true);
  });
});
