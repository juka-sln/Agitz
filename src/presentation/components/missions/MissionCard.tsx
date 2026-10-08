import { useState, type RefObject } from 'react';

import { MISSIONS, type MissionId } from '@/application/learning/missions';
import { docTitle } from '@/content/catalog';
import { MISSION_TEXTS } from '@/content/missions';

import { useTranslation } from '../../hooks/useTranslation';
import { useDocsStore } from '../../stores/docsStore';
import { RichText } from '../docs/RichText';

import { BadgeMedal } from './BadgeMedal';

interface MissionCardProps {
  readonly mission: MissionId;
  /** When it was accomplished, or `null` while it is still to do. */
  readonly completedAt: string | null;
  readonly isCurrent: boolean;
  readonly headingRef: RefObject<HTMLHeadingElement>;
}

/** One mission in detail: its goal, hints revealed one at a time, and where to learn more. */
export function MissionCard({ mission, completedAt, isCurrent, headingRef }: MissionCardProps) {
  const { t, language } = useTranslation();
  const openDocs = useDocsStore((state) => state.open);
  const text = MISSION_TEXTS[mission][language];
  const docId = MISSIONS.find((candidate) => candidate.id === mission)?.docId ?? null;
  const [shownHints, setShownHints] = useState(completedAt === null ? 0 : text.hints.length);
  const number = MISSIONS.findIndex((candidate) => candidate.id === mission) + 1;

  return (
    <section
      aria-labelledby="mission-title"
      className="border-rule bg-surface-raised/40 flex flex-col gap-3 rounded-lg border p-4"
    >
      <div className="flex items-center gap-3">
        <BadgeMedal mission={mission} earned={completedAt !== null} />
        <div className="min-w-0">
          <p className="text-ink-muted text-xs font-bold uppercase">
            {isCurrent ? t('missions.current') : t('missions.selected', { number })}
          </p>
          <h3
            id="mission-title"
            ref={headingRef}
            tabIndex={-1}
            className="text-ink text-base font-bold"
          >
            {text.title}
          </h3>
        </div>
      </div>
      {completedAt !== null && (
        <p className="text-ink font-semibold">
          <span aria-hidden="true">✓ </span>
          {t('missions.doneOn', {
            date: new Intl.DateTimeFormat(language, { dateStyle: 'long' }).format(
              new Date(completedAt),
            ),
          })}{' '}
          · {text.badge}
        </p>
      )}
      <div>
        <h4 className="text-ink-muted text-xs font-bold uppercase">{t('missions.goal')}</h4>
        <p className="mt-0.5">
          <RichText text={text.goal} />
        </p>
      </div>
      {shownHints > 0 && (
        <div>
          <h4 className="text-ink-muted text-xs font-bold uppercase">{t('missions.hints')}</h4>
          <ol className="mt-1 flex list-decimal flex-col gap-1.5 pl-5">
            {text.hints.slice(0, shownHints).map((hint) => (
              <li key={hint}>
                <RichText text={hint} />
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {shownHints < text.hints.length && (
          <button
            type="button"
            onClick={() => {
              setShownHints((count) => count + 1);
            }}
            className="text-ink text-sm font-semibold underline underline-offset-2"
          >
            {t('missions.showHint', { shown: shownHints, total: text.hints.length })}
          </button>
        )}
        {docId !== null && (
          <button
            type="button"
            onClick={() => {
              openDocs(docId);
            }}
            className="text-ink text-sm font-semibold underline underline-offset-2"
          >
            {t('missions.readDoc', { title: docTitle(docId, language) })}
          </button>
        )}
      </div>
    </section>
  );
}
