import { render, screen } from '@testing-library/react';

import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

import { App } from './App';

describe('App', () => {
  it('renders the header, the empty graph, the files panel and the terminal', () => {
    render(<App store={createTestSessionStore()} />);

    expect(screen.getByRole('heading', { name: 'Agitz' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aucun dépôt Git ici' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Fichiers' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Commande' })).toHaveFocus();
  });
});
