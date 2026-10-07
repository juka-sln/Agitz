import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { selectCurrentPage, useDocsStore } from '@/presentation/stores/docsStore';
import { usePreferencesStore } from '@/presentation/stores/preferencesStore';
import { SessionProvider } from '@/presentation/stores/SessionProvider';
import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

import { Terminal } from './Terminal';

function renderTerminal(commands: string[] = []) {
  const store = createTestSessionStore(commands);
  render(
    <SessionProvider store={store}>
      <Terminal />
    </SessionProvider>,
  );
  return { store, input: screen.getByRole('textbox', { name: 'Commande' }) };
}

describe('Terminal', () => {
  beforeEach(() => {
    useDocsStore.setState({ isOpen: false, history: [null] });
    usePreferencesStore.setState({ language: 'fr' });
  });

  it('runs a command and prints its output under the prompt', async () => {
    const user = userEvent.setup();
    const { input } = renderTerminal();

    await user.type(input, 'git init{Enter}');

    const log = screen.getByRole('log');
    expect(log).toHaveTextContent('alice@agitz ~/project $');
    expect(screen.getByText('git init', { selector: 'span' })).toBeInTheDocument();
    expect(log).toHaveTextContent('Initialized empty Git repository in /home/alice/project/.git/');
    expect(input).toHaveValue('');
  });

  it('shows the current branch in the prompt', () => {
    renderTerminal(['git init']);

    expect(screen.getByRole('log')).toHaveTextContent('~/project (main) $');
  });

  it('recalls previous commands with the arrow keys', async () => {
    const user = userEvent.setup();
    const { input } = renderTerminal(['git init', 'git status']);

    await user.type(input, '{ArrowUp}');
    expect(input).toHaveValue('git status');
    await user.type(input, '{ArrowUp}');
    expect(input).toHaveValue('git init');
    await user.type(input, '{ArrowDown}{ArrowDown}');
    expect(input).toHaveValue('');
  });

  it('completes commands with Tab and lists ambiguous candidates', async () => {
    const user = userEvent.setup();
    const { input } = renderTerminal(['git init']);

    await user.type(input, 'git stat{Tab}');
    expect(input).toHaveValue('git status ');

    await user.clear(input);
    await user.type(input, 'git c{Tab}');
    expect(screen.getByText(/Suggestions/)).toHaveTextContent('checkout cherry-pick commit');
  });

  it('marks errors', async () => {
    const user = userEvent.setup();
    const { input } = renderTerminal();

    await user.type(input, 'git status{Enter}');
    expect(screen.getByText(/^fatal: not a git repository/)).toHaveClass('text-terminal-error');
  });

  it('never traps keyboard focus', async () => {
    const user = userEvent.setup();
    render(<button type="button">after</button>);
    const { input } = renderTerminal();

    input.focus();
    await user.tab();
    expect(input).not.toHaveFocus();

    input.focus();
    await user.keyboard('{Escape}');
    expect(input).not.toHaveFocus();
  });

  it('shows a pending merge in the prompt like git-prompt', () => {
    renderTerminal([
      'git init',
      'echo base > a.txt',
      'git add .',
      'git commit -m "feat: base"',
      'git checkout -b feature',
      'echo theirs > a.txt',
      'git commit -am "feat: theirs"',
      'git checkout main',
      'echo ours > a.txt',
      'git commit -am "feat: ours"',
      'git merge feature',
    ]);

    expect(screen.getByRole('log')).toHaveTextContent('~/project (main|MERGING) $');
  });

  it('explains the last command in plain words', async () => {
    const user = userEvent.setup();
    const { input } = renderTerminal(['git init']);
    const log = screen.getByRole('log');
    expect(log).toHaveTextContent('Un dossier caché .git vient d’être créé');

    await user.type(input, 'touch a.txt{Enter}git add a.txt{Enter}');

    expect(log).not.toHaveTextContent('Un dossier caché');
    expect(log).toHaveTextContent('Le fichier a.txt est maintenant dans l’index');
  });

  it('explains errors and follows the interface language', () => {
    usePreferencesStore.setState({ language: 'en' });
    render(
      <SessionProvider store={createTestSessionStore(['git status'])}>
        <Terminal />
      </SessionProvider>,
    );

    expect(screen.getByRole('log')).toHaveTextContent(
      'This folder is not a Git repository (yet). Start with git init.',
    );
  });

  it('opens the page of the command with “Learn more”', async () => {
    const user = userEvent.setup();
    renderTerminal(['git init']);

    await user.click(screen.getByRole('button', { name: 'En savoir plus sur git init' }));

    expect(useDocsStore.getState().isOpen).toBe(true);
    expect(selectCurrentPage(useDocsStore.getState())).toBe('init');
  });

  it('opens the page of the command being typed with F1', async () => {
    const user = userEvent.setup();
    const { input } = renderTerminal(['git init']);

    await user.type(input, 'git reb{F1}');
    expect(selectCurrentPage(useDocsStore.getState())).toBe('init');

    useDocsStore.setState({ isOpen: false });
    await user.type(input, 'ase main{F1}');
    expect(selectCurrentPage(useDocsStore.getState())).toBe('rebase');
  });
});
