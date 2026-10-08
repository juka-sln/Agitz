import { useId, useState, type FormEvent } from 'react';

import type { FileWriteProblem } from '@/domain/entities/Workspace';
import { normalizePath } from '@/domain/value-objects/FilePath';

import { useSession } from '../../hooks/useSession';
import { useTranslation } from '../../hooks/useTranslation';
import { FILE_WRITE_PROBLEMS } from '../editor/problemMessages';

/** Creates an empty file (folders included) and opens it in the editor. */
export function NewFileForm({
  onCreated,
  onCancel,
}: {
  readonly onCreated: (path: string) => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation();
  const files = useSession((state) => state.workspace.files);
  const saveFile = useSession((state) => state.saveFile);
  const [path, setPath] = useState('');
  const [problem, setProblem] = useState<FileWriteProblem | null>(null);
  const inputId = useId();
  const problemId = useId();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizePath(path.trim());
    if (normalized !== null && Object.hasOwn(files, normalized)) {
      onCreated(normalized);
      return;
    }
    const writeProblem = saveFile(path.trim(), '');
    setProblem(writeProblem);
    if (writeProblem === null && normalized !== null) {
      onCreated(normalized);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5 px-4 pb-3">
      <label htmlFor={inputId} className="text-ink-muted text-xs">
        {t('files.newFilePath')}
      </label>
      <input
        id={inputId}
        value={path}
        onChange={(event) => {
          setPath(event.target.value);
          setProblem(null);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onCancel();
          }
        }}
        placeholder="src/notes.md"
        aria-invalid={problem !== null}
        aria-describedby={problem === null ? undefined : problemId}
        // The form only appears on request: focusing it right away saves a click.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        className="border-rule bg-canvas text-ink rounded-md border px-2 py-1 font-mono text-xs"
      />
      {problem !== null && (
        <p id={problemId} className="text-status-deleted text-xs">
          {t(FILE_WRITE_PROBLEMS[problem])}
        </p>
      )}
      <div className="flex gap-1.5">
        <button
          type="submit"
          disabled={path.trim() === ''}
          className="rounded-md bg-(--line-1) px-2.5 py-0.5 text-xs font-semibold text-(--line-1-ink) disabled:opacity-50"
        >
          {t('files.create')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-ink-muted hover:text-ink rounded-md px-2 py-0.5 text-xs font-semibold"
        >
          {t('editor.cancel')}
        </button>
      </div>
    </form>
  );
}
