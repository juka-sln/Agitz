import type { RefObject } from 'react';

import type { ConflictResolution } from '@/application/queries/getConflictResolution';

import { useTranslation } from '../../hooks/useTranslation';

import { RunCommand } from './RunCommand';

const STEP_CLASSES = {
  resolve: 'bg-status-deleted text-canvas',
  stage: 'bg-status-modified text-canvas',
} as const;

function Step({
  number,
  title,
  children,
}: {
  readonly number: number;
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="bg-surface-raised text-ink flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      >
        {number}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3 className="text-ink font-bold">{title}</h3>
        {children}
      </div>
    </li>
  );
}

/** The three steps of any conflict, with the files and commands still waiting. */
export function ConflictOverview({
  resolution,
  headingRef,
  onOpen,
}: {
  readonly resolution: ConflictResolution;
  readonly headingRef: RefObject<HTMLHeadingElement>;
  readonly onOpen: (path: string) => void;
}) {
  const { t } = useTranslation();
  const toStage = resolution.files.filter((file) => file.step === 'stage');
  const allStaged = resolution.files.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <h2 ref={headingRef} tabIndex={-1} className="text-ink text-base font-bold">
        {t(`editor.operation.${resolution.operation ?? 'stash'}`)}
      </h2>
      <ol className="flex flex-col gap-5">
        <Step number={1} title={t('editor.steps.resolve')}>
          <p className="text-ink-muted">{t('editor.steps.resolveBody')}</p>
          {resolution.files.length > 0 && (
            <ul className="border-rule divide-rule divide-y rounded-md border">
              {resolution.files.map((file) => (
                <li key={file.path} className="flex items-center gap-2 px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onOpen(file.path);
                    }}
                    className="text-ink min-w-0 flex-1 truncate text-left font-mono text-xs font-semibold underline-offset-2 hover:underline"
                  >
                    {file.path}
                  </button>
                  <span
                    className={`rounded px-1.5 text-xs font-semibold ${STEP_CLASSES[file.step]}`}
                  >
                    {t(`editor.fileStep.${file.step}`)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Step>
        <Step number={2} title={t('editor.steps.stage')}>
          <p className="text-ink-muted">{t('editor.steps.stageBody')}</p>
          {toStage.map((file) => (
            <RunCommand key={file.path} command={file.stageCommand} />
          ))}
        </Step>
        <Step number={3} title={t('editor.steps.conclude')}>
          {resolution.continueCommand === null ? (
            <p className="text-ink-muted">{t('editor.steps.stashDone')}</p>
          ) : (
            <>
              {!allStaged && <p className="text-ink-muted">{t('editor.steps.concludeWaiting')}</p>}
              <RunCommand command={resolution.continueCommand} disabled={!allStaged} />
            </>
          )}
        </Step>
      </ol>
      {resolution.abortCommand !== null && (
        <div className="border-rule flex flex-col gap-2 border-t pt-3">
          <p className="text-ink-muted">{t('editor.steps.abort')}</p>
          <RunCommand command={resolution.abortCommand} />
        </div>
      )}
    </div>
  );
}
