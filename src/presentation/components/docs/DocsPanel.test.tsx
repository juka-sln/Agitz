import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

import { useDocsStore } from '../../stores/docsStore';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { SessionProvider } from '../../stores/SessionProvider';
import { AppHeader } from '../layout/AppHeader';

import { DocsPanel } from './DocsPanel';

function renderPanel() {
  render(
    <SessionProvider store={createTestSessionStore()}>
      <AppHeader />
      <DocsPanel />
    </SessionProvider>,
  );
  return { toggle: screen.getByRole('button', { name: 'Documentation' }) };
}

describe('DocsPanel', () => {
  beforeEach(() => {
    useDocsStore.setState({ isOpen: false, history: [null] });
    usePreferencesStore.setState({ language: 'fr' });
  });

  it('opens the table of contents from the header and focuses its title', async () => {
    const user = userEvent.setup();
    const { toggle } = renderPanel();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('complementary', { name: 'Documentation' });
    expect(within(panel).getByRole('heading', { level: 2, name: 'Documentation' })).toHaveFocus();
    expect(within(panel).getByRole('button', { name: /git rebase/ })).toBeInTheDocument();
    expect(
      within(panel).getByRole('button', { name: /Écrire de bons messages de commit/ }),
    ).toBeInTheDocument();
  });

  it('shows every section of a command page', async () => {
    const user = userEvent.setup();
    const { toggle } = renderPanel();
    await user.click(toggle);

    await user.click(screen.getByRole('button', { name: /git commit/ }));

    expect(screen.getByRole('heading', { level: 2, name: 'git commit' })).toHaveFocus();
    for (const section of [
      'Ce qu’elle fait',
      'Syntaxe et options',
      'Exemples',
      'Sous le capot',
      'Pièges courants',
      'Voir aussi',
    ]) {
      expect(screen.getByRole('heading', { level: 3, name: section })).toBeInTheDocument();
    }
    expect(screen.getByText('git commit --amend --no-edit', { selector: 'dt code' })).toBeVisible();
  });

  it('follows related links and goes back', async () => {
    const user = userEvent.setup();
    const { toggle } = renderPanel();
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: /git merge/ }));

    await user.click(screen.getByRole('button', { name: 'Merge ou rebase ?' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Merge ou rebase ?' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Page précédente' }));
    expect(screen.getByRole('heading', { level: 2, name: 'git merge' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sommaire' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Documentation' })).toBeInTheDocument();
  });

  it('filters the table of contents', async () => {
    const user = userEvent.setup();
    const { toggle } = renderPanel();
    await user.click(toggle);

    await user.type(screen.getByRole('searchbox', { name: /Rechercher/ }), 'stash');
    expect(screen.getByRole('button', { name: /git stash/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /git commit/ })).not.toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'xyz');
    expect(screen.getByRole('status')).toHaveTextContent('Aucun résultat pour « stashxyz ».');
  });

  it('closes with Escape and gives focus back', async () => {
    const user = userEvent.setup();
    const { toggle } = renderPanel();
    await user.click(toggle);

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('follows the interface language', async () => {
    usePreferencesStore.setState({ language: 'en' });
    useDocsStore.getState().open('reset');
    renderPanel();

    expect(screen.getByRole('heading', { level: 3, name: 'Under the hood' })).toBeInTheDocument();
    expect(screen.getByText(/Moves the current branch to another commit/)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Close the documentation' }));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});
