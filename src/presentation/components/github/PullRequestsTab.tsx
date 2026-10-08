import { useMemo, useState } from 'react';

import type { HostedProject } from '@/domain/entities/GitHub';
import type { PullRequest } from '@/domain/entities/PullRequest';

import { useGitHub } from '../../hooks/useGitHub';
import { useTranslation } from '../../hooks/useTranslation';
import { useGitHubStore, type GitHubView } from '../../stores/githubStore';

import { NewPullRequestForm } from './NewPullRequestForm';
import { PullRequestStateBadge } from './PullRequestStateBadge';
import { PullRequestView } from './PullRequestView';
import { Button, EmptyState } from './ui';

type Filter = 'open' | 'closed';

function PullRequestList({ project }: { readonly project: HostedProject }) {
  const { t } = useTranslation();
  const { hosting } = useGitHub();
  const navigate = useGitHubStore((state) => state.navigate);
  const [filter, setFilter] = useState<Filter>('open');
  const all = useMemo(
    () =>
      hosting.github.pullRequests
        .filter((pullRequest) => pullRequest.repository === project.url)
        .toReversed(),
    [hosting.github.pullRequests, project.url],
  );
  const isShown = (pullRequest: PullRequest) =>
    filter === 'open' ? pullRequest.state === 'open' : pullRequest.state !== 'open';
  const shown = all.filter(isShown);
  const openCount = all.filter((pullRequest) => pullRequest.state === 'open').length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1" role="group" aria-label={t('github.pulls.filter')}>
          {(['open', 'closed'] as const).map((value) => (
            <Button
              key={value}
              variant={filter === value ? 'secondary' : 'quiet'}
              aria-pressed={filter === value}
              onClick={() => {
                setFilter(value);
              }}
            >
              {value === 'open'
                ? t('github.pulls.open', { count: openCount })
                : t('github.pulls.closed', { count: all.length - openCount })}
            </Button>
          ))}
        </div>
        <Button
          variant="primary"
          onClick={() => {
            navigate({ page: 'newPull' });
          }}
        >
          {t('github.pulls.new')}
        </Button>
      </div>
      {shown.length === 0 ? (
        <EmptyState>{t('github.pulls.empty')}</EmptyState>
      ) : (
        <ul className="border-rule divide-rule divide-y rounded-md border">
          {shown.map((pullRequest) => (
            <li key={pullRequest.number}>
              <button
                type="button"
                onClick={() => {
                  navigate({ page: 'pull', number: pullRequest.number });
                }}
                className="hover:bg-surface-raised flex w-full items-start gap-2 px-3 py-2 text-left"
              >
                <PullRequestStateBadge state={pullRequest.state} />
                <span className="min-w-0 flex-1">
                  <span className="text-ink block font-semibold">{pullRequest.title}</span>
                  <span className="text-ink-muted block text-xs">
                    {t('github.pulls.summary', {
                      number: pullRequest.number,
                      author: pullRequest.author.id,
                      base: pullRequest.base,
                      head: pullRequest.head.branch,
                    })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PullRequestsTab({
  project,
  view,
}: {
  readonly project: HostedProject;
  readonly view: GitHubView;
}) {
  if (view.page === 'newPull') {
    return <NewPullRequestForm project={project} head={view.head} />;
  }
  if (view.page === 'pull') {
    return <PullRequestView project={project} number={view.number} />;
  }
  return <PullRequestList project={project} />;
}
