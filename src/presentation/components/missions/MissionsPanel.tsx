import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { MISSION_IDS } from '@/application/learning/missions';
import { MISSION_TEXTS } from '@/content/missions';

import { useTranslation } from '../../hooks/useTranslation';
import { useMissionsStore } from '../../stores/missionsStore';
import { selectCompletedMissions, useProgressStore } from '../../stores/progressStore';
import { Button } from '../github/ui';
import { MISSIONS_PANEL_ID } from '../layout/panelIds';

import { BadgeMedal } from './BadgeMedal';
import { MissionCard } from './MissionCard';

const toolbarButtonClass =
  'inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md px-2 text-sm font-semibold text-ink-muted hover:bg-surface-raised hover:text-ink';

function ResetProgress() {
  const { t } = useTranslation();
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const [confirming, setConfirming] = useState(false);

  return confirming ? (
    <div role="alert" className="flex flex-col items-start gap-2">
      <p className="text-status-modified font-semibold">{t('missions.resetWarning')}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="danger"
          onClick={() => {
            resetProgress();
            setConfirming(false);
          }}
        >
          {t('missions.resetConfirm')}
        </Button>
        <Button
          variant="quiet"
          onClick={() => {
            setConfirming(false);
          }}
        >
          {t('missions.cancel')}
        </Button>
      </div>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => {
        setConfirming(true);
      }}
      className="text-ink-muted hover:text-ink self-start text-xs font-semibold underline underline-offset-2"
    >
      {t('missions.reset')}
    </button>
  );
}

/**
 * The guided course, beside the sandbox rather than instead of it: the missions only
 * watch what happens in the terminals and on GitHub.
 */
export function MissionsPanel() {
  const { t, language } = useTranslation();
  const isOpen = useMissionsStore((state) => state.isOpen);
  const selected = useMissionsStore((state) => state.selected);
  const select = useMissionsStore((state) => state.select);
  const close = useMissionsStore((state) => state.close);
  const completedAt = useProgressStore((state) => state.completedAt);
  const dismissToast = useProgressStore((state) => state.dismiss);
  const completed = selectCompletedMissions({ completedAt });
  const current = MISSION_IDS.find((mission) => completedAt[mission] === undefined) ?? null;
  const shown = selected ?? current;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardHeadingRef = useRef<HTMLHeadingElement>(null);
  const hasSelection = selected !== null;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    dismissToast();
    const returnFocusTo = document.activeElement;
    return () => {
      if (returnFocusTo instanceof HTMLElement && returnFocusTo.isConnected) {
        returnFocusTo.focus();
      }
    };
  }, [isOpen, dismissToast]);

  useEffect(() => {
    if (isOpen) {
      (hasSelection ? cardHeadingRef : headingRef).current?.focus();
    }
  }, [isOpen, selected, hasSelection]);

  if (!isOpen) {
    return null;
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  };

  return (
    // Escape is handled for the whole panel, whichever control has focus inside it.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <aside
      id={MISSIONS_PANEL_ID}
      aria-label={t('missions.title')}
      onKeyDown={handleKeyDown}
      className="docs-panel-enter border-rule bg-surface text-ink absolute inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l text-sm leading-relaxed shadow-2xl"
    >
      <div className="border-rule flex h-11 shrink-0 items-center gap-1 border-b px-2">
        {selected !== null && selected !== current && current !== null && (
          <button
            type="button"
            className={toolbarButtonClass}
            onClick={() => {
              select(null);
            }}
          >
            <span aria-hidden="true">←</span> {t('missions.backToCurrent')}
          </button>
        )}
        <span className="flex-1" />
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={close}
          title={t('missions.close')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <span className="sr-only">{t('missions.close')}</span>
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-4 pb-8">
        <div className="flex flex-col gap-2">
          <h2 ref={headingRef} tabIndex={-1} className="text-ink text-base font-bold">
            {t('missions.title')}
          </h2>
          <p className="text-ink-muted">{t('missions.intro')}</p>
          <div className="flex items-center gap-3">
            <progress
              aria-label={t('missions.progress')}
              value={completed.length}
              max={MISSION_IDS.length}
              className="mission-progress h-2 flex-1"
            />
            <span className="text-ink-muted shrink-0 text-xs font-semibold">
              {t('missions.progressValue', {
                done: completed.length,
                total: MISSION_IDS.length,
              })}
            </span>
          </div>
        </div>

        {shown === null ? (
          <p className="text-ink font-semibold">{t('missions.allDone')}</p>
        ) : (
          <MissionCard
            key={shown}
            mission={shown}
            completedAt={completedAt[shown] ?? null}
            isCurrent={shown === current}
            headingRef={cardHeadingRef}
          />
        )}

        <section aria-labelledby="missions-list" className="flex flex-col gap-2">
          <h3 id="missions-list" className="text-ink-muted text-xs font-bold uppercase">
            {t('missions.list')}
          </h3>
          <ol className="flex flex-col gap-1">
            {MISSION_IDS.map((mission) => {
              const isDone = completedAt[mission] !== undefined;
              const text = MISSION_TEXTS[mission][language];
              return (
                <li key={mission}>
                  <button
                    type="button"
                    aria-current={mission === shown ? 'step' : undefined}
                    onClick={() => {
                      select(mission === current ? null : mission);
                    }}
                    className={`hover:bg-surface-raised flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left ${mission === shown ? 'bg-surface-raised' : ''}`}
                  >
                    <BadgeMedal mission={mission} earned={isDone} size={28} />
                    <span className="min-w-0 flex-1">
                      <span className="text-ink block font-semibold">{text.title}</span>
                      <span className="text-ink-muted block text-xs">
                        {isDone ? text.badge : t('missions.badgeLocked')}
                      </span>
                    </span>
                    {isDone && (
                      <span className="text-ink text-xs font-semibold">
                        <span aria-hidden="true">✓</span>
                        <span className="sr-only">{t('missions.done')}</span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <ResetProgress />
      </div>
    </aside>
  );
}
