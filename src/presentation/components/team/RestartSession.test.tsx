import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SessionProvider } from '@/presentation/stores/SessionProvider';
import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

import { RestartSession } from './RestartSession';

function renderRestart() {
  const store = createTestSessionStore(['git init', 'echo hi > a.txt']);
  store.getState().addUser('Carol');
  render(
    <SessionProvider store={store}>
      <RestartSession />
    </SessionProvider>,
  );
  return store;
}

describe('RestartSession', () => {
  it('starts over only once confirmed', async () => {
    const user = userEvent.setup();
    const store = renderRestart();

    await user.click(screen.getByRole('button', { name: 'Tout recommencer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('remis à zéro');
    expect(store.getState().workspace.repository).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Recommencer' }));
    expect(store.getState().workspace.repository).toBeNull();
    expect(store.getState().users).toHaveLength(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('can be cancelled', async () => {
    const user = userEvent.setup();
    const store = renderRestart();

    await user.click(screen.getByRole('button', { name: 'Tout recommencer' }));
    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(store.getState().workspace.files).toEqual({ 'a.txt': 'hi\n' });
    expect(screen.getByRole('button', { name: 'Tout recommencer' })).toBeInTheDocument();
  });
});
