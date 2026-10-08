import { useState } from 'react';

import { createConflictScenario } from '@/application/simulation/conflictScenario';
import { SHARED_REPOSITORY_URL } from '@/application/simulation/teamSetup';

import { useSession } from '../../hooks/useSession';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../github/ui';

/** Whether anything was done yet, in which case the scenario must erase it first. */
function useSessionIsBlank(): boolean {
  return useSession(
    (state) =>
      state.users.length === 2 &&
      [state, ...Object.values(state.otherWorkstations)].every(
        (workstation) =>
          workstation.entries.length === 0 &&
          workstation.workspace.repository === null &&
          Object.keys(workstation.workspace.files).length === 0,
      ),
  );
}

/** Starts the scenario of the specification: two teammates change the same line. */
export function ScenarioCard({ onConflict }: { readonly onConflict: (path: string) => void }) {
  const { t } = useTranslation();
  const isBlank = useSessionIsBlank();
  const reset = useSession((state) => state.reset);
  const play = useSession((state) => state.play);
  const users = useSession((state) => state.users);
  const [confirming, setConfirming] = useState(false);

  const start = () => {
    reset();
    const [owner, teammate] = users;
    if (owner === undefined || teammate === undefined) {
      return;
    }
    play(createConflictScenario(owner, teammate, SHARED_REPOSITORY_URL));
    setConfirming(false);
    onConflict('README.md');
  };

  return (
    <section
      aria-labelledby="conflict-scenario"
      className="border-rule flex flex-col items-start gap-2 rounded-md border p-4"
    >
      <h3 id="conflict-scenario" className="text-ink font-bold">
        {t('editor.scenario.title')}
      </h3>
      <p>{t('editor.scenario.body')}</p>
      {confirming ? (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="text-status-modified font-semibold">{t('editor.scenario.resetWarning')}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" onClick={start}>
              {t('editor.scenario.confirm')}
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setConfirming(false);
              }}
            >
              {t('editor.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="primary"
          onClick={() => {
            if (isBlank) {
              start();
            } else {
              setConfirming(true);
            }
          }}
        >
          {t('editor.scenario.start')}
        </Button>
      )}
    </section>
  );
}
