import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

import { useEditorStore } from '../../stores/editorStore';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { SessionProvider } from '../../stores/SessionProvider';
import { AppHeader } from '../layout/AppHeader';

import { EditorPanel } from './EditorPanel';

function renderEditor(commands: readonly string[] = []) {
  const store = createTestSessionStore(commands);
  render(
    <SessionProvider store={store}>
      <AppHeader />
      <EditorPanel />
    </SessionProvider>,
  );
  return store;
}

const panel = () => screen.getByRole('complementary', { name: 'Éditeur' });

describe('EditorPanel', () => {
  beforeEach(() => {
    useEditorStore.setState({ isOpen: false, path: null });
    usePreferencesStore.setState({ language: 'fr' });
  });

  it('walks through the conflict scenario up to the merge commit', async () => {
    const user = userEvent.setup();
    const store = renderEditor();

    await user.click(screen.getByRole('button', { name: 'Éditeur' }));
    await user.click(within(panel()).getByRole('button', { name: 'Lancer le scénario' }));

    expect(within(panel()).getByRole('heading', { level: 2, name: 'README.md' })).toHaveFocus();
    expect(screen.getByRole('button', { name: /Fichiers en conflit : 1/ })).toBeInTheDocument();
    const conflict = within(panel()).getByRole('region', { name: 'Conflit 1 sur 1' });
    expect(conflict).toHaveTextContent('<<<<<<< HEAD');
    expect(conflict).toHaveTextContent('>>>>>>> origin/docs/opening-hours');

    await user.click(within(conflict).getByRole('button', { name: 'Garder les deux' }));
    expect(within(panel()).getByRole('status')).toHaveTextContent('Enregistre');
    await user.click(within(panel()).getByRole('button', { name: 'Enregistrer' }));

    expect(store.getState().workspace.files['README.md']).toBe(
      '# Bakery\nFresh bread every morning.\nOpen from 7am to 7pm, closed on Sundays.\nOpen every day from 6am to 8pm.\n',
    );
    await user.click(
      within(panel()).getByRole('button', {
        name: 'Exécuter dans le terminal : git add README.md',
      }),
    );
    await user.click(
      within(panel()).getByRole('button', { name: 'Exécuter dans le terminal : git commit' }),
    );

    const state = store.getState();
    expect(state.entries.at(-1)?.commandLine).toBe('git commit');
    expect(state.entries.at(-1)?.exitCode).toBe(0);
    expect(state.workspace.repository?.operation).toBeNull();
    expect(within(panel()).queryByRole('status')).not.toBeInTheDocument();
  });

  it('lists the steps left in the overview', async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.click(screen.getByRole('button', { name: 'Éditeur' }));
    await user.click(within(panel()).getByRole('button', { name: 'Lancer le scénario' }));

    await user.click(within(panel()).getByRole('button', { name: /Vue d’ensemble/ }));

    expect(
      within(panel()).getByRole('heading', { level: 2, name: 'Fusion en cours' }),
    ).toHaveFocus();
    expect(within(panel()).getByText('à corriger')).toBeInTheDocument();
    expect(
      within(panel()).getByRole('button', { name: 'Exécuter dans le terminal : git commit' }),
    ).toBeDisabled();
    expect(
      within(panel()).getByRole('button', {
        name: 'Exécuter dans le terminal : git merge --abort',
      }),
    ).toBeEnabled();
  });

  it('asks before erasing a session in progress', async () => {
    const user = userEvent.setup();
    const store = renderEditor(['git init']);
    await user.click(screen.getByRole('button', { name: 'Éditeur' }));

    await user.click(within(panel()).getByRole('button', { name: 'Lancer le scénario' }));
    expect(within(panel()).getByRole('alert')).toHaveTextContent('seront effacés');
    await user.click(within(panel()).getByRole('button', { name: 'Annuler' }));

    expect(store.getState().entries).toHaveLength(1);
  });

  it('edits a file and saves it with Ctrl+S', async () => {
    const user = userEvent.setup();
    const store = renderEditor(['echo "hello" > notes.txt']);

    act(() => {
      useEditorStore.getState().open('notes.txt');
    });
    const textarea = within(panel()).getByRole('textbox', { name: 'Contenu de notes.txt' });
    await user.type(textarea, 'world');
    expect(within(panel()).getByText('non enregistré')).toBeInTheDocument();
    await user.keyboard('{Control>}s{/Control}');

    expect(store.getState().workspace.files['notes.txt']).toBe('hello\nworld');
    expect(within(panel()).queryByText('non enregistré')).not.toBeInTheDocument();
  });

  it('follows a command rewriting the file while it is open', async () => {
    const store = renderEditor(['echo "v1" > notes.txt']);
    act(() => {
      useEditorStore.getState().open('notes.txt');
    });

    store.getState().run('echo "v2" > notes.txt');

    expect(
      await within(panel()).findByRole('textbox', { name: 'Contenu de notes.txt' }),
    ).toHaveValue('v2\n');
  });
});
