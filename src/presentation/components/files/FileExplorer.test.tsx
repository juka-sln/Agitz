import { render, screen, within } from '@testing-library/react';

import { SessionProvider } from '@/presentation/stores/SessionProvider';
import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

import { FileExplorer } from './FileExplorer';

function renderExplorer(commands: string[]) {
  render(
    <SessionProvider store={createTestSessionStore(commands)}>
      <FileExplorer />
    </SessionProvider>,
  );
  return screen.getByRole('navigation', { name: 'Fichiers' });
}

describe('FileExplorer', () => {
  it('invites to create a first file', () => {
    expect(renderExplorer([])).toHaveTextContent('Aucun fichier pour l’instant');
  });

  it('shows folders, files and their Git status', () => {
    const explorer = renderExplorer([
      'git init',
      'echo a > src/app.ts',
      'echo b > README.md',
      'git add README.md',
    ]);
    const items = within(explorer).getAllByRole('listitem');

    expect(items.map((item) => item.textContent)).toEqual(['README.mdA', 'src', 'app.tsU']);
    expect(within(explorer).getByTitle('Nouveau fichier ajouté à l’index')).toHaveTextContent('A');
    expect(
      within(explorer).getByTitle('Non suivi : Git ne connaît pas encore ce fichier'),
    ).toBeInTheDocument();
  });

  it('explains that files are not tracked before git init', () => {
    expect(renderExplorer(['touch a.txt'])).toHaveTextContent('Pas encore de dépôt');
  });
});
