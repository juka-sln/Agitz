import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SessionProvider } from '@/presentation/stores/SessionProvider';
import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

import { UserSwitcher } from './UserSwitcher';

function renderSwitcher(commands: string[] = []) {
  const store = createTestSessionStore(commands);
  render(
    <SessionProvider store={store}>
      <UserSwitcher />
    </SessionProvider>,
  );
  return store;
}

describe('UserSwitcher', () => {
  it('lists the team with the branch of each workstation', () => {
    renderSwitcher(['git init']);
    const team = screen.getByRole('region', { name: 'Équipe' });

    expect(
      within(team).getByRole('button', { name: /Alice \(poste actif\) main/ }),
    ).toHaveAttribute('aria-current', 'true');
    expect(within(team).getByRole('button', { name: /Bob aucun dépôt/ })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('switches to another workstation', async () => {
    const user = userEvent.setup();
    const store = renderSwitcher();
    await user.click(screen.getByRole('button', { name: /^Bob/ }));

    expect(store.getState().activeUser.id).toBe('bob');
    expect(screen.getByRole('button', { name: /^Bob/ })).toHaveAttribute('aria-current', 'true');
  });

  it('adds a teammate and refuses duplicates', async () => {
    const user = userEvent.setup();
    const store = renderSwitcher();
    await user.click(screen.getByRole('button', { name: /Ajouter/ }));
    const input = screen.getByRole('textbox', { name: 'Prénom du coéquipier' });
    expect(input).toHaveFocus();

    await user.type(input, 'bob{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('Ce coéquipier existe déjà.');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    await user.clear(input);
    await user.type(input, 'Carol{Enter}');
    expect(store.getState().users.map((member) => member.id)).toEqual(['alice', 'bob', 'carol']);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Carol/ })).toBeInTheDocument();
  });

  it('closes the form with Escape', async () => {
    const user = userEvent.setup();
    renderSwitcher();
    await user.click(screen.getByRole('button', { name: /Ajouter/ }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
