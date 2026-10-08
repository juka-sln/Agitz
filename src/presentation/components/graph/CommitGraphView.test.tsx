import { render, screen } from '@testing-library/react';

import { SessionProvider } from '@/presentation/stores/SessionProvider';
import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

import { CommitGraphView } from './CommitGraphView';

function renderGraph(commands: string[]) {
  render(
    <SessionProvider store={createTestSessionStore(commands)}>
      <div style={{ width: 800, height: 600 }}>
        <CommitGraphView />
      </div>
    </SessionProvider>,
  );
}

describe('CommitGraphView', () => {
  it('guides toward git init when there is no repository', () => {
    renderGraph([]);
    expect(screen.getByRole('heading', { name: 'Aucun dépôt Git ici' })).toBeInTheDocument();
  });

  it('guides toward the first commit in an empty repository', () => {
    renderGraph(['git init']);
    expect(screen.getByRole('heading', { name: 'Dépôt prêt, aucun commit' })).toBeInTheDocument();
  });

  it('draws one station per commit with branch and HEAD labels', async () => {
    renderGraph([
      'git init',
      'echo a > a.txt',
      'git add .',
      'git commit -m "feat: add a"',
      'git checkout -b feature',
    ]);

    expect(await screen.findByText('feat: add a')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('feature')).toBeInTheDocument();
    expect(screen.getByTitle(/Tu es ici/)).toHaveTextContent('HEAD');
  });

  it('offers a text summary for screen readers', async () => {
    renderGraph(['git init', 'touch a', 'git add .', 'git commit -m "feat: add a"']);

    expect(
      await screen.findByText('Commits : 1, du plus récent au plus ancien. HEAD : main.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent(/^[0-9a-f]{7}, feat: add a, main$/);
  });
});
