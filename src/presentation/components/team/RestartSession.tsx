import { useState } from 'react';

import { useSession } from '../../hooks/useSession';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../github/ui';

/** The session is saved in the browser, so starting over has to be asked for explicitly. */
export function RestartSession() {
  const { t } = useTranslation();
  const reset = useSession((state) => state.reset);
  const [confirming, setConfirming] = useState(false);

  return (
    <section aria-labelledby="restart-title" className="border-rule mt-auto border-t px-4 py-3">
      <h2 id="restart-title" className="sr-only">
        {t('session.title')}
      </h2>
      <p className="text-ink-muted text-xs">{t('session.saved')}</p>
      {confirming ? (
        <div role="alert" className="mt-2 flex flex-col items-start gap-2 text-xs">
          <p className="text-status-modified font-semibold">{t('session.restartWarning')}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              onClick={() => {
                reset();
                setConfirming(false);
              }}
            >
              {t('session.restartConfirm')}
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setConfirming(false);
              }}
            >
              {t('session.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setConfirming(true);
          }}
          className="text-ink-muted hover:text-ink mt-1 text-xs font-semibold underline underline-offset-2"
        >
          {t('session.restart')}
        </button>
      )}
    </section>
  );
}
