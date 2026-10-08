import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SessionProvider } from '@/presentation/stores/SessionProvider';
import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

import { useGitHubStore } from '../../stores/githubStore';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { AppHeader } from '../layout/AppHeader';

import { GitHubPanel } from './GitHubPanel';

const PUBLISH = [
  'git init',
  'echo "# Project" > README.md',
  'echo "name: CI" > .github/workflows/ci.yml',
  'git add .',
  'git commit -m "feat: initial commit"',
  'git remote add origin https://github.com/alice/project.git',
  'git push -u origin main',
];

const BOB_FEATURE = [
  'git clone https://github.com/alice/project.git',
  'git checkout -b feature/greeting',
  'echo hello > hello.txt',
  'git add .',
  'git commit -m "feat: add greeting"',
  'git push -u origin feature/greeting',
];

function renderGitHub(store = createTestSessionStore(PUBLISH)) {
  render(
    <SessionProvider store={store}>
      <AppHeader />
      <GitHubPanel />
    </SessionProvider>,
  );
  return store;
}

function panel() {
  return within(screen.getByRole('complementary', { name: 'GitHub' }));
}

async function openProject(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'GitHub' }));
  await user.click(panel().getByRole('button', { name: /^alice\/project/ }));
}

describe('GitHubPanel', () => {
  beforeEach(() => {
    useGitHubStore.setState({ isOpen: false, repository: null, view: { page: 'code' } });
    usePreferencesStore.setState({ language: 'fr' });
  });

  it('lists the hosted repositories and opens one with its branches and CI status', async () => {
    const user = userEvent.setup();
    renderGitHub();
    await user.click(screen.getByRole('button', { name: 'GitHub' }));

    expect(panel().getByRole('heading', { level: 2, name: 'Dépôts sur GitHub' })).toHaveFocus();
    await user.click(panel().getByRole('button', { name: /^alice\/project/ }));

    expect(panel().getByRole('heading', { level: 2, name: 'alice/project' })).toHaveFocus();
    expect(panel().getByText('git clone https://github.com/alice/project.git')).toBeInTheDocument();
    const branches = panel().getByRole('list', { name: 'Branches sur GitHub' });
    expect(branches).toHaveTextContent(/main.*par défaut.*CI réussie.*feat: initial commit/);
  });

  it('opens, reviews and merges a pull request', async () => {
    const user = userEvent.setup();
    const store = createTestSessionStore(PUBLISH);
    store.getState().switchUser('bob');
    BOB_FEATURE.forEach((command) => {
      store.getState().run(command);
    });
    renderGitHub(store);
    await openProject(user);

    await user.click(panel().getByRole('button', { name: 'Comparer et ouvrir une PR' }));
    expect(panel().getByText(/Fusion possible/)).toBeInTheDocument();
    await user.type(panel().getByRole('textbox', { name: 'Description' }), 'Greets visitors.');
    await user.click(panel().getByRole('button', { name: 'Créer la pull request' }));

    expect(
      panel().getByRole('heading', { level: 3, name: /feat: add greeting #1/ }),
    ).toBeInTheDocument();
    expect(panel().getByRole('radio', { name: 'Approuver' })).toBeDisabled();

    await user.click(panel().getByRole('button', { name: 'Demander' }));
    expect(panel().getByText(/a approuvé ces changements/)).toBeInTheDocument();

    await user.click(panel().getByRole('radio', { name: 'Squash and merge' }));
    await user.click(panel().getByRole('button', { name: 'Squash and merge' }));

    expect(panel().getByText('Fusionnée')).toBeInTheDocument();
    expect(panel().getByText(/en un seul commit/)).toBeInTheDocument();
    const hosted = store.getState().network.repositories['https://github.com/alice/project.git'];
    expect(hosted?.commits[hosted.branches.main ?? '']?.message).toBe(
      'feat: add greeting (#1)\n\n* feat: add greeting',
    );
  });

  it('explains why a merge is blocked', async () => {
    const user = userEvent.setup();
    const store = createTestSessionStore(PUBLISH);
    store.getState().act((actions, state) =>
      actions.updateBranchProtection.execute(state, {
        repository: 'https://github.com/alice/project.git',
        branch: 'main',
        protection: { requirePullRequest: true, requiredApprovals: 1, requireStatusChecks: true },
        actor: store.getState().activeUser,
      }),
    );
    store.getState().switchUser('bob');
    [...BOB_FEATURE.slice(0, 4), 'git commit -m "wip"', BOB_FEATURE[5] ?? ''].forEach((command) => {
      store.getState().run(command);
    });
    renderGitHub(store);
    await openProject(user);
    await user.click(panel().getByRole('button', { name: 'Comparer et ouvrir une PR' }));
    await user.click(panel().getByRole('button', { name: 'Créer la pull request' }));

    expect(panel().getByText(/0 approbation\(s\) sur 1/)).toBeInTheDocument();
    expect(panel().getByText(/La CI doit être verte/)).toBeInTheDocument();
    expect(panel().getByText(/« wip » ne suit pas Conventional Commits/)).toBeInTheDocument();
    expect(panel().getByRole('button', { name: 'Fusionner la pull request' })).toBeDisabled();
  });
});
