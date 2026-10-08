import { useId, useRef, useState, type FormEvent } from 'react';

import type { UserNameProblem } from '@/domain/entities/SimulatedUser';
import { USER_NAME_MAX_LENGTH } from '@/domain/entities/SimulatedUser';

import { useSession } from '../../hooks/useSession';
import { useTeam } from '../../hooks/useTeam';
import { useTranslation } from '../../hooks/useTranslation';
import type { MessageKey } from '../../i18n/messages';

import { Avatar } from './Avatar';

const PROBLEM_MESSAGES: Record<UserNameProblem, MessageKey> = {
  empty: 'team.error.empty',
  tooLong: 'team.error.tooLong',
  invalid: 'team.error.invalid',
  taken: 'team.error.taken',
};

function AddUserForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const addUser = useSession((state) => state.addUser);
  const [name, setName] = useState('');
  const [problem, setProblem] = useState<UserNameProblem | null>(null);
  const inputId = useId();
  const errorId = useId();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = addUser(name);
    setProblem(result);
    if (result === null) {
      onDone();
    }
  };

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-1.5 px-4">
      <label htmlFor={inputId} className="text-ink-muted text-xs font-semibold">
        {t('team.newUserLabel')}
      </label>
      <div className="flex gap-1.5">
        <input
          id={inputId}
          // The form only appears after a click on "Add", so moving the focus there is expected.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          value={name}
          maxLength={USER_NAME_MAX_LENGTH + 10}
          onChange={(event) => {
            setName(event.target.value);
            setProblem(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onDone();
            }
          }}
          aria-invalid={problem !== null}
          aria-describedby={problem === null ? undefined : errorId}
          className="border-rule bg-canvas text-ink min-w-0 flex-1 rounded-md border px-2 py-1 text-sm"
          placeholder="Carol"
        />
        <button
          type="submit"
          className="bg-ink text-canvas rounded-md px-2.5 py-1 text-sm font-semibold"
        >
          {t('team.add')}
        </button>
      </div>
      {problem !== null && (
        <p id={errorId} role="alert" className="text-status-deleted text-xs">
          {t(PROBLEM_MESSAGES[problem], { max: USER_NAME_MAX_LENGTH })}
        </p>
      )}
    </form>
  );
}

/** One workstation per simulated teammate: switching changes files, repository and terminal at once. */
export function UserSwitcher() {
  const { t } = useTranslation();
  const team = useTeam();
  const switchUser = useSession((state) => state.switchUser);
  const [isAdding, setIsAdding] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <section aria-labelledby="team-title" className="border-rule border-b pb-3">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 id="team-title" className="text-ink text-sm font-bold">
          {t('team.title')}
        </h2>
        {!isAdding && (
          <button
            ref={addButtonRef}
            type="button"
            onClick={() => {
              setIsAdding(true);
            }}
            className="text-ink-muted hover:bg-surface-raised hover:text-ink rounded-md px-1.5 py-0.5 text-xs font-semibold"
          >
            + {t('team.add')}
          </button>
        )}
      </div>
      <ul className="flex flex-col gap-0.5 px-2">
        {team.map(({ user, isActive, location, colorToken }) => (
          <li key={user.id}>
            <button
              type="button"
              aria-current={isActive ? 'true' : undefined}
              onClick={() => {
                switchUser(user.id);
              }}
              className={`flex w-full items-center gap-2.5 rounded-md border-l-4 px-2 py-1.5 text-left ${
                isActive
                  ? 'bg-surface-raised border-ink'
                  : 'hover:bg-surface-raised border-transparent'
              }`}
            >
              <Avatar name={user.identity.name} colorToken={colorToken} />
              <span className="min-w-0 flex-1">
                <span className="text-ink block text-sm font-semibold">
                  {user.identity.name}
                  {isActive && (
                    <>
                      {' '}
                      <span className="sr-only">({t('team.active')})</span>
                    </>
                  )}
                </span>{' '}
                <span className="text-ink-muted block truncate font-mono text-xs">
                  {location ?? t('team.noRepository')}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {isAdding && (
        <AddUserForm
          onDone={() => {
            setIsAdding(false);
            requestAnimationFrame(() => addButtonRef.current?.focus());
          }}
        />
      )}
    </section>
  );
}
