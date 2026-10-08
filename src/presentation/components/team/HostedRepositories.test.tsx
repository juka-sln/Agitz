import { render, screen } from '@testing-library/react';

import { SessionProvider } from '@/presentation/stores/SessionProvider';
import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

import { HostedRepositories } from './HostedRepositories';

function renderHosted(commands: string[]) {
  render(
    <SessionProvider store={createTestSessionStore(commands)}>
      <HostedRepositories />
    </SessionProvider>,
  );
  return screen.getByRole('region', { name: 'GitHub' });
}

describe('HostedRepositories', () => {
  it('shows the shared repository, empty at first', () => {
    const panel = renderHosted([]);

    expect(panel).toHaveTextContent('https://github.com/alice/project.git');
    expect(panel).toHaveTextContent('Dépôt vide');
  });

  it('shows the branches pushed by any workstation', () => {
    const panel = renderHosted([
      'git init',
      'echo hi > a.txt',
      'git add .',
      'git commit -m "feat: start"',
      'git remote add origin https://github.com/alice/project.git',
      'git push -u origin main',
    ]);

    expect(screen.getByRole('list', { name: 'Branches sur GitHub' })).toHaveTextContent(
      /^main \(branche par défaut\)[0-9a-f]{7}$/,
    );
    expect(panel).not.toHaveTextContent('Dépôt vide');
  });
});
