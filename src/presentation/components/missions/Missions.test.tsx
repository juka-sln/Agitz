import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { App } from '@/presentation/App';
import { useMissionsStore } from '@/presentation/stores/missionsStore';
import { useProgressStore } from '@/presentation/stores/progressStore';
import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

const FIRST_COMMIT = ['git init', 'echo hi > a.txt', 'git add .', 'git commit -m "feat: start"'];

describe('guided course', () => {
  afterEach(() => {
    act(() => {
      useMissionsStore.getState().close();
      useProgressStore.getState().resetProgress();
    });
  });

  it('announces the badges earned by a command, then shows the next mission', async () => {
    const user = userEvent.setup();
    const store = createTestSessionStore();
    render(<App store={store} />);
    expect(
      screen.getByRole('button', { name: /0 missions sur 12 accomplies/ }),
    ).toBeInTheDocument();

    act(() => {
      FIRST_COMMIT.forEach((command) => {
        store.getState().run(command);
      });
    });
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('2 badges obtenus : Premier pas, Plume claire');
    expect(
      screen.getByRole('button', { name: /2 missions sur 12 accomplies/ }),
    ).toBeInTheDocument();

    await user.click(within(status).getByRole('button', { name: 'Voir le parcours' }));
    const panel = await screen.findByRole('complementary', { name: 'Parcours guidé' });
    expect(status).toBeEmptyDOMElement();
    expect(within(panel).getByRole('progressbar', { name: 'Progression' })).toHaveAttribute(
      'value',
      '2',
    );
    const card = within(panel).getByRole('region', { name: 'Bifurquer' });
    expect(card).toHaveTextContent('Mission en cours');

    await user.click(within(card).getByRole('button', { name: 'Afficher un indice (0/2)' }));
    expect(card).toHaveTextContent('git checkout -b feature/menu');
    expect(within(card).getByRole('button', { name: 'Afficher un indice (1/2)' })).toBeVisible();
  });

  it('shows any mission from the list, then goes back to the current one', async () => {
    const user = userEvent.setup();
    render(<App store={createTestSessionStore(FIRST_COMMIT)} />);
    act(() => {
      useMissionsStore.getState().open();
    });
    const panel = await screen.findByRole('complementary', { name: 'Parcours guidé' });

    await user.click(within(panel).getByRole('button', { name: /^Premier commit/ }));
    const card = within(panel).getByRole('region', { name: 'Premier commit' });
    expect(card).toHaveTextContent('Mission 1');
    expect(card).toHaveTextContent('Accomplie le');
    expect(card).toHaveTextContent('git init');

    await user.click(within(panel).getByRole('button', { name: /Revenir à la mission en cours/ }));
    expect(within(panel).getByRole('region', { name: 'Bifurquer' })).toBeInTheDocument();
  });

  it('resets the badges once confirmed, without touching the session', async () => {
    const user = userEvent.setup();
    const store = createTestSessionStore(FIRST_COMMIT);
    render(<App store={store} />);
    act(() => {
      useMissionsStore.getState().open();
    });
    const panel = await screen.findByRole('complementary', { name: 'Parcours guidé' });

    await user.click(within(panel).getByRole('button', { name: 'Réinitialiser la progression' }));
    await user.click(within(panel).getByRole('button', { name: 'Réinitialiser' }));

    expect(useProgressStore.getState().completedAt).toEqual({});
    expect(store.getState().workspace.repository).not.toBeNull();
  });
});
