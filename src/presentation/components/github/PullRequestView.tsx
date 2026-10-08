import { useMemo, useState } from 'react';

import { getPullRequestChanges } from '@/application/queries/getGitHubViews';
import { findProject, findPullRequest, type HostedProject } from '@/domain/entities/GitHub';

import { useGitHub } from '../../hooks/useGitHub';
import { useTranslation } from '../../hooks/useTranslation';
import { Avatar } from '../team/Avatar';

import { CommitList, FileDiffView } from './ChangeList';
import { MergeBox } from './MergeBox';
import { PullRequestStateBadge } from './PullRequestStateBadge';
import { ReviewForm } from './ReviewForm';
import { ReviewTimeline } from './ReviewTimeline';
import { Button, EmptyState } from './ui';
import { useAvatarToken } from './useAvatarToken';

type Section = 'conversation' | 'commits' | 'files';

export function PullRequestView({
  project,
  number,
}: {
  readonly project: HostedProject;
  readonly number: number;
}) {
  const { t } = useTranslation();
  const { hosting, actions } = useGitHub();
  const avatarToken = useAvatarToken();
  const [section, setSection] = useState<Section>('conversation');
  const pullRequest = findPullRequest(hosting.github, project.url, number);
  const status = useMemo(
    () => (pullRequest === undefined ? null : actions.pullRequestStatus(hosting, pullRequest)),
    [actions, hosting, pullRequest],
  );
  const changes = useMemo(
    () =>
      pullRequest === undefined || status === null
        ? null
        : getPullRequestChanges(hosting, pullRequest, status),
    [hosting, pullRequest, status],
  );

  if (pullRequest === undefined || status === null) {
    return <EmptyState>{t('github.problem.pullRequestNotFound', { number })}</EmptyState>;
  }
  const headOwner = findProject(hosting.github, pullRequest.head.repository)?.owner ?? '';
  const sections: readonly { readonly id: Section; readonly label: string }[] = [
    { id: 'conversation', label: t('github.pull.conversation') },
    { id: 'commits', label: t('github.commits', { count: changes?.commits.length ?? 0 }) },
    { id: 'files', label: t('github.filesChanged', { count: changes?.files.length ?? 0 }) },
  ];

  return (
    <article className="flex flex-col gap-4" aria-labelledby={`pull-${String(number)}`}>
      <header className="flex flex-col gap-1.5">
        <h3 id={`pull-${String(number)}`} className="text-ink text-lg font-bold">
          {pullRequest.title}{' '}
          <span className="text-ink-muted font-normal">#{pullRequest.number}</span>
        </h3>
        <p className="text-ink-muted flex flex-wrap items-center gap-2 text-xs">
          <PullRequestStateBadge state={pullRequest.state} />
          <span>
            {t(
              pullRequest.merge === null ? 'github.pull.wantsToMerge' : 'github.pull.mergedSummary',
              {
                author: pullRequest.merge?.by.id ?? pullRequest.author.id,
                count: changes?.commits.length ?? 0,
                base: `${project.owner}:${pullRequest.base}`,
                head: `${headOwner}:${pullRequest.head.branch}`,
              },
            )}
          </span>
        </p>
      </header>

      <div
        className="border-rule flex gap-1 border-b"
        role="group"
        aria-label={t('github.pull.sections')}
      >
        {sections.map((entry) => (
          <Button
            key={entry.id}
            variant="quiet"
            aria-pressed={section === entry.id}
            className={`-mb-px rounded-b-none border-b-2 ${section === entry.id ? 'text-ink border-(--line-5)' : 'border-transparent'}`}
            onClick={() => {
              setSection(entry.id);
            }}
          >
            {entry.label}
          </Button>
        ))}
      </div>

      {section === 'conversation' && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Avatar
              name={pullRequest.author.identity.name}
              colorToken={avatarToken(pullRequest.author.id)}
            />
            <div className="border-rule min-w-0 flex-1 rounded-md border">
              <p className="border-rule text-ink-muted border-b px-3 py-1.5 text-xs">
                <strong className="text-ink">{pullRequest.author.id}</strong>{' '}
                {t('github.pull.opened')}
              </p>
              <p className="text-ink px-3 py-2 whitespace-pre-wrap">
                {pullRequest.body === '' ? (
                  <span className="text-ink-muted italic">{t('github.pull.noDescription')}</span>
                ) : (
                  pullRequest.body
                )}
              </p>
            </div>
          </div>
          <ReviewTimeline reviews={pullRequest.reviews} />
          <MergeBox pullRequest={pullRequest} status={status} />
          {pullRequest.state === 'open' && <ReviewForm pullRequest={pullRequest} />}
        </div>
      )}
      {section === 'commits' &&
        (changes === null ? (
          <EmptyState>{t('github.pull.branchGone')}</EmptyState>
        ) : (
          <CommitList commits={changes.commits} />
        ))}
      {section === 'files' &&
        (changes === null ? (
          <EmptyState>{t('github.pull.branchGone')}</EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {changes.files.map((file) => (
              <FileDiffView key={file.path} file={file} />
            ))}
          </div>
        ))}
    </article>
  );
}
