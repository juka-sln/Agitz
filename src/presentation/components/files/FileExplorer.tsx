import { useTranslation } from '../../hooks/useTranslation';
import { useWorkingTreeEntries } from '../../hooks/useWorkspaceViews';

import { buildFileTree } from './buildFileTree';
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

  return (
    <nav aria-label={t('files.title')} className="flex h-full flex-col">
      <h2 className="text-ink px-4 pt-4 pb-2 text-sm font-bold">{t('files.title')}</h2>
      {entries.length === 0 ? (
        <div className="text-ink-muted px-4 text-sm">
          <p>{t('files.empty')}</p>
          <code className="bg-surface-raised text-ink mt-2 block rounded px-2 py-1 font-mono text-xs">
            {'echo "Hello" > README.md'}
          </code>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto pb-4 text-sm">
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
                  <span
                    className={`min-w-0 flex-1 truncate ${isGoneFromDisk(row.entry) ? 'text-ink-muted line-through' : 'text-ink'}`}
                  >
                    {row.name}
                  </span>
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
