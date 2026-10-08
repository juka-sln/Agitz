import { useState } from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { useWorkingTreeEntries } from '../../hooks/useWorkspaceViews';
import { useEditorStore } from '../../stores/editorStore';

import { buildFileTree } from './buildFileTree';
import { NewFileForm } from './NewFileForm';
import { isGoneFromDisk, statusBadges, type BadgeTone } from './statusBadges';

const BADGE_CLASSES: Record<BadgeTone, string> = {
  staged: 'text-status-staged',
  modified: 'text-status-modified',
  untracked: 'text-status-untracked',
  deleted: 'text-status-deleted',
  conflict: 'rounded bg-status-deleted px-1 text-canvas',
};

function FolderIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="text-ink-muted shrink-0"
    >
      <path
        d="M1.5 3.5h5l1.5 1.5h6.5v8h-13z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FileExplorer() {
  const { t } = useTranslation();
  const { entries, isRepository } = useWorkingTreeEntries();
  const rows = buildFileTree(entries);
  const openEditor = useEditorStore((state) => state.open);
  const editedPath = useEditorStore((state) => (state.isOpen ? state.path : null));
  const [isCreating, setIsCreating] = useState(false);

  return (
    <nav aria-label={t('files.title')} className="flex min-h-40 flex-1 flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-ink text-sm font-bold">{t('files.title')}</h2>
        <button
          type="button"
          onClick={() => {
            setIsCreating((value) => !value);
          }}
          aria-expanded={isCreating}
          title={t('files.newFile')}
          className="text-ink-muted hover:bg-surface-raised hover:text-ink inline-flex size-7 items-center justify-center rounded-md"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <span className="sr-only">{t('files.newFile')}</span>
        </button>
      </div>
      {isCreating && (
        <NewFileForm
          onCreated={(path) => {
            setIsCreating(false);
            openEditor(path);
          }}
          onCancel={() => {
            setIsCreating(false);
          }}
        />
      )}
      {entries.length === 0 ? (
        <div className="text-ink-muted px-4 text-sm">
          <p>{t('files.empty')}</p>
          <code className="bg-surface-raised text-ink mt-2 block rounded px-2 py-1 font-mono text-xs">
            {'echo "Hello" > README.md'}
          </code>
        </div>
      ) : (
        <ul className="pb-4 text-sm">
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex items-center gap-1.5 py-1 pr-3"
              style={{ paddingLeft: `${1 + row.depth * 0.9}rem` }}
            >
              {row.kind === 'directory' ? (
                <>
                  <FolderIcon />
                  <span className="text-ink-muted">{row.name}</span>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      openEditor(row.entry.path);
                    }}
                    aria-label={t('files.openInEditor', { path: row.entry.path })}
                    aria-current={editedPath === row.entry.path ? 'page' : undefined}
                    className={`min-w-0 flex-1 truncate text-left underline-offset-2 hover:underline ${isGoneFromDisk(row.entry) ? 'text-ink-muted line-through' : 'text-ink'} ${editedPath === row.entry.path ? 'font-semibold' : ''}`}
                  >
                    {row.name}
                  </button>
                  {statusBadges(row.entry).map((badge) => (
                    <abbr
                      key={`${badge.tone}-${badge.letter}`}
                      title={t(badge.label)}
                      className={`font-mono text-xs font-semibold no-underline ${BADGE_CLASSES[badge.tone]}`}
                    >
                      {badge.letter}
                    </abbr>
                  ))}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {!isRepository && entries.length > 0 && (
        <p className="border-rule text-ink-muted border-t px-4 py-3 text-xs">
          {t('files.notTracked')}
        </p>
      )}
    </nav>
  );
}
