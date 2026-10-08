import { useState, type KeyboardEvent, type RefObject } from 'react';

import type { ConflictResolution } from '@/application/queries/getConflictResolution';
import type { FileWriteProblem } from '@/domain/entities/Workspace';
import {
  countConflicts,
  parseConflictedFile,
  resolveConflict,
  type ConflictChoice,
  type ConflictedFile,
} from '@/domain/services/conflictMarkers';

import { useSession } from '../../hooks/useSession';
import { useTranslation } from '../../hooks/useTranslation';
import { useConflictResolution } from '../../hooks/useWorkspaceViews';
import { Button } from '../github/ui';

import { ConflictBlockView } from './ConflictBlockView';
import { NextStep } from './NextStep';
import { FILE_WRITE_PROBLEMS } from './problemMessages';

type Mode = 'guided' | 'text';

function GuidedView({
  file,
  onResolve,
}: {
  readonly file: ConflictedFile;
  readonly onResolve: (conflictIndex: number, choice: ConflictChoice) => void;
}) {
  const count = countConflicts(file);
  // The rank of each conflict among the blocks, as `resolveConflict` counts them.
  const conflictIndexes = file.blocks.reduce<number[]>((indexes, block) => {
    const previous = indexes.at(-1) ?? -1;
    indexes.push(block.kind === 'conflict' ? previous + 1 : previous);
    return indexes;
  }, []);

  return (
    <div className="border-rule rounded-md border py-1 font-mono text-xs leading-5">
      {file.blocks.map((block, blockIndex) => {
        if (block.kind === 'text') {
          return (
            // Blocks follow the order of the file, which only changes by re-rendering them all.
            <pre key={blockIndex} className="text-ink px-3 break-all whitespace-pre-wrap">
              {block.lines.join('\n')}
            </pre>
          );
        }
        const index = conflictIndexes[blockIndex] ?? 0;
        return (
          <div key={blockIndex} className="px-1">
            <ConflictBlockView
              block={block}
              index={index}
              count={count}
              onResolve={(choice) => {
                onResolve(index, choice);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function ModeSwitch({
  mode,
  onChange,
}: {
  readonly mode: Mode;
  readonly onChange: (mode: Mode) => void;
}) {
  const { t } = useTranslation();
  const modes: readonly Mode[] = ['guided', 'text'];
  return (
    <div
      role="group"
      aria-label={t('editor.mode')}
      className="border-rule inline-flex rounded-md border p-0.5"
    >
      {modes.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => {
            onChange(value);
          }}
          className={`rounded px-2.5 py-0.5 text-xs font-semibold ${mode === value ? 'bg-surface-raised text-ink' : 'text-ink-muted hover:text-ink'}`}
        >
          {t(`editor.mode.${value}`)}
        </button>
      ))}
    </div>
  );
}

function stepOf(resolution: ConflictResolution | null, path: string) {
  return resolution?.files.find((file) => file.path === path) ?? null;
}

/**
 * A small text editor for one file of the active workstation. While the file holds conflict
 * markers, each conflict can be settled with one click, or the raw text edited by hand.
 */
export function FileEditor({
  path,
  headingRef,
  onOpen,
}: {
  readonly path: string;
  readonly headingRef: RefObject<HTMLHeadingElement>;
  readonly onOpen: (path: string | null) => void;
}) {
  const { t } = useTranslation();
  const disk = useSession((state) => state.workspace.files[path]);
  const userName = useSession((state) => state.activeUser.identity.name);
  const saveFile = useSession((state) => state.saveFile);
  const resolution = useConflictResolution();

  const [draft, setDraft] = useState(disk ?? '');
  const [loaded, setLoaded] = useState(disk);
  const [problem, setProblem] = useState<FileWriteProblem | null>(null);
  const parsed = parseConflictedFile(draft);
  const conflicts = countConflicts(parsed);
  const [mode, setMode] = useState<Mode>(conflicts > 0 ? 'guided' : 'text');

  // A command rewrote the file: follow it, unless that would throw away unsaved edits.
  const isDirty = draft !== (loaded ?? '');
  if (disk !== loaded && !isDirty) {
    setLoaded(disk);
    setDraft(disk ?? '');
  }
  const changedOnDisk = disk !== loaded;
  const hasUnsavedChanges = draft !== (disk ?? '') || disk === undefined;

  const save = () => {
    const writeProblem = saveFile(path, draft);
    setProblem(writeProblem);
    if (writeProblem === null) {
      setLoaded(draft);
    }
  };
  const reload = () => {
    setLoaded(disk);
    setDraft(disk ?? '');
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      save();
    }
  };

  const fileStep = stepOf(resolution, path);
  const textareaId = `editor-${path}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-ink font-mono text-base font-bold break-all"
        >
          {path}
        </h2>
        {hasUnsavedChanges && disk !== undefined && (
          <span className="text-status-modified text-xs font-semibold">{t('editor.unsaved')}</span>
        )}
      </div>

      {disk === undefined && draft === '' ? (
        <div className="flex flex-col items-start gap-2">
          <p>{t('editor.missing', { user: userName })}</p>
          {fileStep !== null && <p className="text-ink-muted">{t('editor.missingConflict')}</p>}
          <Button onClick={save}>{t('editor.recreate')}</Button>
        </div>
      ) : (
        <>
          {changedOnDisk && (
            <div className="border-status-modified flex flex-wrap items-center gap-2 rounded-md border px-3 py-2">
              <p className="flex-1">{t('editor.changedOnDisk')}</p>
              <Button onClick={reload}>{t('editor.reload')}</Button>
            </div>
          )}
          {conflicts > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-status-deleted mr-auto font-semibold">
                  {t('editor.remaining', { count: conflicts })}
                </p>
                <ModeSwitch mode={mode} onChange={setMode} />
              </div>
              <p className="text-ink-muted">{t('editor.markersHint')}</p>
              {resolution?.operation === 'rebase' && (
                <p className="text-ink-muted">{t('editor.rebaseHint')}</p>
              )}
            </div>
          )}

          {conflicts > 0 && mode === 'guided' ? (
            <GuidedView
              file={parsed}
              onResolve={(conflictIndex, choice) => {
                setDraft(resolveConflict(draft, conflictIndex, choice));
              }}
            />
          ) : (
            <>
              <label htmlFor={textareaId} className="sr-only">
                {t('editor.content', { path })}
              </label>
              <textarea
                id={textareaId}
                value={draft}
                spellCheck={false}
                onChange={(event) => {
                  setDraft(event.target.value);
                }}
                onKeyDown={handleKeyDown}
                aria-describedby="editor-shortcut"
                className="border-rule bg-canvas text-ink min-h-64 w-full resize-y rounded-md border p-3 font-mono text-xs leading-5"
              />
            </>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={save} disabled={!hasUnsavedChanges}>
              {t('editor.save')}
            </Button>
            <Button onClick={reload} disabled={!isDirty}>
              {t('editor.discard')}
            </Button>
            <span id="editor-shortcut" className="text-ink-muted text-xs">
              {t('editor.saveShortcut')}
            </span>
          </div>
          {problem !== null && (
            <p role="alert" className="text-status-deleted">
              {t(FILE_WRITE_PROBLEMS[problem])}
            </p>
          )}
        </>
      )}

      <NextStep
        path={path}
        resolution={resolution}
        hasUnsavedChanges={hasUnsavedChanges && disk !== undefined}
        conflictsInDraft={conflicts}
        onOpen={onOpen}
      />
    </div>
  );
}
