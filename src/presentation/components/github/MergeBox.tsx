import { useId, useState } from 'react';

import type {
  MergeBlocker,
  PullRequestStatus,
} from '@/application/github-features/support/comparePullRequest';
import { findBranchProtection, findHostedRepository } from '@/domain/entities/Network';
import { MERGE_METHODS, type MergeMethod, type PullRequest } from '@/domain/entities/PullRequest';
import { findBranch } from '@/domain/entities/Repository';
import { shortHash } from '@/domain/value-objects/Hash';

import { useGitHub, useGitHubAction } from '../../hooks/useGitHub';
import { useTranslation } from '../../hooks/useTranslation';
import { RichText } from '../docs/RichText';

import { ChecksSummary } from './ChecksSummary';
import { CommandSnippet } from './CommandSnippet';
import { Box, Button, ProblemAlert } from './ui';

function BlockerText({ blocker, base }: { readonly blocker: MergeBlocker; readonly base: string }) {
  const { t } = useTranslation();
  switch (blocker.kind) {
    case 'conflicts':
      return (
        <RichText text={t('github.blocker.conflicts', { paths: blocker.paths.join(', '), base })} />
      );
    case 'approvals':
      return (
        <RichText
          text={t('github.blocker.approvals', {
            required: blocker.required,
            current: blocker.current,
          })}
        />
      );
    case 'changesRequested':
      return (
        <RichText
          text={t('github.blocker.changesRequested', { reviewers: blocker.reviewers.join(', ') })}
        />
      );
    case 'checks':
      return <RichText text={t('github.blocker.checks')} />;
    default:
      return <RichText text={t(`github.blocker.${blocker.kind}`)} />;
  }
}

function MergedBox({ pullRequest }: { readonly pullRequest: PullRequest }) {
  const { t } = useTranslation();
  const { hosting } = useGitHub();
  const { problem, run } = useGitHubAction();
  const merge = pullRequest.merge;
  if (merge === null) {
    return null;
  }
  const headRepository = findHostedRepository(hosting.network, pullRequest.head.repository);
  const canDelete =
    headRepository !== undefined &&
    findBranch(headRepository, pullRequest.head.branch) !== undefined &&
    findBranchProtection(hosting.network, pullRequest.head.repository, pullRequest.head.branch) ===
      undefined;

  return (
    <Box className="flex flex-col gap-2 p-3">
      <p className="text-ink font-semibold">
        {t(`github.merged.${merge.method}`, {
          login: merge.by.id,
          commit: shortHash(merge.commit),
          base: pullRequest.base,
        })}
      </p>
      <p className="text-ink-muted text-xs">
        <RichText text={t('github.merged.pullHint', { base: pullRequest.base })} />
      </p>
      <CommandSnippet command={`git checkout ${pullRequest.base}`} />
      <CommandSnippet command="git pull" />
      {canDelete && (
        <div className="flex flex-col gap-1 pt-1">
          <p className="text-ink-muted text-xs">{t('github.merged.deleteHint')}</p>
          <div>
            <Button
              variant="danger"
              aria-label={`${t('github.deleteBranch')} ${pullRequest.head.branch}`}
              onClick={() =>
                run((actions, state) =>
                  actions.deleteBranch.execute(state, {
                    repository: pullRequest.head.repository,
                    branch: pullRequest.head.branch,
                  }),
                )
              }
            >
              {t('github.deleteBranch')}
            </Button>
          </div>
          <ProblemAlert problem={problem} />
        </div>
      )}
    </Box>
  );
}

export function MergeBox({
  pullRequest,
  status,
}: {
  readonly pullRequest: PullRequest;
  readonly status: PullRequestStatus;
}) {
  const { t } = useTranslation();
  const { actor } = useGitHub();
  const { problem, run } = useGitHubAction();
  const [method, setMethod] = useState<MergeMethod>('merge');
  const groupId = useId();
  const reference = { repository: pullRequest.repository, number: pullRequest.number };

  if (pullRequest.state === 'merged') {
    return <MergedBox pullRequest={pullRequest} />;
  }
  if (pullRequest.state === 'closed') {
    return (
      <Box className="flex flex-col items-start gap-2 p-3">
        <p className="text-ink font-semibold">{t('github.closedNotice')}</p>
        <Button
          onClick={() =>
            run((actions, state) =>
              actions.closePullRequest.execute(state, { ...reference, reopen: true }),
            )
          }
        >
          {t('github.reopen')}
        </Button>
        <ProblemAlert problem={problem} />
      </Box>
    );
  }

  const blockers = status.blockers;
  return (
    <Box className="flex flex-col gap-3 p-3">
      <ChecksSummary run={status.checks} />
      <div className="border-rule border-t pt-3">
        {blockers.length === 0 ? (
          <p className="text-status-staged font-semibold">{t('github.mergeable')}</p>
        ) : (
          <ul className="text-ink flex list-disc flex-col gap-1 pl-4">
            {blockers.map((blocker) => (
              <li key={blocker.kind}>
                <BlockerText blocker={blocker} base={pullRequest.base} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <fieldset className="flex flex-col gap-1">
        <legend className="text-ink mb-1 text-xs font-semibold">{t('github.mergeMethod')}</legend>
        {MERGE_METHODS.map((option) => (
          <div key={option} className="flex items-start gap-2 text-sm">
            <input
              id={`${groupId}-${option}`}
              type="radio"
              className="mt-1"
              name={`merge-method-${groupId}`}
              checked={method === option}
              aria-describedby={`${groupId}-${option}-hint`}
              onChange={() => {
                setMethod(option);
              }}
            />
            <div>
              <label htmlFor={`${groupId}-${option}`} className="text-ink font-semibold">
                {t(`github.method.${option}`)}
              </label>
              <p id={`${groupId}-${option}-hint`} className="text-ink-muted text-xs">
                {t(`github.method.${option}.hint`)}
              </p>
            </div>
          </div>
        ))}
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          disabled={blockers.length > 0}
          onClick={() =>
            run((actions, state) =>
              actions.mergePullRequest.execute(state, { ...reference, method, actor }),
            )
          }
        >
          {t(`github.method.${method}.button`)}
        </Button>
        <Button
          variant="danger"
          onClick={() =>
            run((actions, state) => actions.closePullRequest.execute(state, reference))
          }
        >
          {t('github.closePullRequest')}
        </Button>
      </div>
      <ProblemAlert problem={problem} />
    </Box>
  );
}
