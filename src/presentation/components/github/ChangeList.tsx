import type { ChangeSummary, FileDiff } from '@/application/queries/getGitHubViews';
import { shortHash } from '@/domain/value-objects/Hash';

import { useTranslation } from '../../hooks/useTranslation';

import { SectionTitle } from './ui';

const LINE_STYLES = {
  added: { prefix: '+', className: 'bg-status-staged/15' },
  removed: { prefix: '-', className: 'bg-status-deleted/15' },
  context: { prefix: ' ', className: '' },
} as const;

export function FileDiffView({ file }: { readonly file: FileDiff }) {
  const { t } = useTranslation();
  return (
    <div className="border-rule overflow-hidden rounded-md border">
      <p className="border-rule bg-surface-raised flex items-center gap-2 border-b px-3 py-1.5 text-xs">
        <span className="text-ink min-w-0 flex-1 truncate font-mono font-semibold">
          {file.path}
        </span>
        <span className="text-status-staged font-mono">+{file.additions}</span>
        <span className="text-status-deleted font-mono">−{file.deletions}</span>
        <span className="sr-only">{t(`github.fileChange.${file.type}`)}</span>
      </p>
      <pre className="py-1 font-mono text-xs leading-5 break-all whitespace-pre-wrap">
        {file.lines.map((line, index) => (
          // Lines never move within a rendered diff, so their position is a stable key.
          <div key={index} className={`px-3 ${LINE_STYLES[line.type].className}`}>
            <span aria-hidden="true" className="text-ink-muted mr-2 select-none">
              {LINE_STYLES[line.type].prefix}
            </span>
            {line.type !== 'context' && (
              <span className="sr-only">{t(`github.line.${line.type}`)} </span>
            )}
            {line.line}
          </div>
        ))}
      </pre>
    </div>
  );
}

export function CommitList({ commits }: { readonly commits: ChangeSummary['commits'] }) {
  return (
    <ul className="border-rule divide-rule divide-y rounded-md border">
      {commits.map((commit) => (
        <li key={commit.hash} className="flex items-baseline gap-2 px-3 py-1.5 text-xs">
          <span className="text-ink-muted font-mono">{shortHash(commit.hash)}</span>
          <span className="text-ink min-w-0 flex-1 truncate">{commit.subject}</span>
          <span className="text-ink-muted">{commit.author}</span>
        </li>
      ))}
    </ul>
  );
}

/** The commits of a comparison, then every changed file with its diff. */
export function ChangeList({ changes }: { readonly changes: ChangeSummary }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>{t('github.commits', { count: changes.commits.length })}</SectionTitle>
      <CommitList commits={changes.commits} />
      <SectionTitle>{t('github.filesChanged', { count: changes.files.length })}</SectionTitle>
      {changes.files.map((file) => (
        <FileDiffView key={file.path} file={file} />
      ))}
    </div>
  );
}
