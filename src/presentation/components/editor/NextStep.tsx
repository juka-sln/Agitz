import type { ReactNode } from 'react';

import type { ConflictResolution } from '@/application/queries/getConflictResolution';

import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../github/ui';

import { RunCommand } from './RunCommand';

function Card({ children }: { readonly children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-md border-l-4 border-(--line-0) bg-(--line-0)/5 px-3 py-2"
    >
      {children}
    </div>
  );
}

/** What to do once the file is edited: save, `git add`, then the next file or the conclusion. */
export function NextStep({
  path,
  resolution,
  hasUnsavedChanges,
  conflictsInDraft,
  onOpen,
}: {
  readonly path: string;
  readonly resolution: ConflictResolution | null;
  readonly hasUnsavedChanges: boolean;
  readonly conflictsInDraft: number;
  readonly onOpen: (path: string | null) => void;
}) {
  const { t } = useTranslation();
  if (resolution === null) {
    return null;
  }
  const file = resolution.files.find((candidate) => candidate.path === path);

  if (file !== undefined) {
    if (hasUnsavedChanges) {
      return conflictsInDraft === 0 ? (
        <Card>
          <p>{t('editor.next.save')}</p>
        </Card>
      ) : null;
    }
    if (file.step === 'resolve') {
      return conflictsInDraft === 0 ? (
        <Card>
          <p>{t('editor.next.markersLeft')}</p>
        </Card>
      ) : null;
    }
    return (
      <Card>
        <p>{t('editor.next.stage')}</p>
        <RunCommand command={file.stageCommand} />
      </Card>
    );
  }

  const nextFile = resolution.files[0];
  if (nextFile !== undefined) {
    return (
      <Card>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => {
              onOpen(nextFile.path);
            }}
          >
            {t('editor.next.nextFile', { path: nextFile.path })}
          </Button>
          <Button
            onClick={() => {
              onOpen(null);
            }}
          >
            {t('editor.next.overview')}
          </Button>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      {resolution.continueCommand === null ? (
        <p>{t('editor.steps.stashDone')}</p>
      ) : (
        <>
          <p>{t('editor.next.conclude')}</p>
          <RunCommand command={resolution.continueCommand} />
        </>
      )}
    </Card>
  );
}
