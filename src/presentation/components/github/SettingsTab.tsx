import { useId, useMemo } from 'react';

import { getRepositoryBranches, type BranchSummary } from '@/application/queries/getGitHubViews';
import {
  DEFAULT_BRANCH_PROTECTION,
  type BranchProtection,
} from '@/domain/entities/BranchProtection';
import type { HostedProject } from '@/domain/entities/GitHub';

import { useGitHub, useGitHubAction } from '../../hooks/useGitHub';
import { useTranslation } from '../../hooks/useTranslation';
import { RichText } from '../docs/RichText';

import { Box, Button, EmptyState, ProblemAlert, SectionTitle } from './ui';

const APPROVAL_CHOICES = [0, 1, 2, 3];

function ProtectionRule({
  project,
  branch,
  disabled,
}: {
  readonly project: HostedProject;
  readonly branch: BranchSummary;
  readonly disabled: boolean;
}) {
  const { t } = useTranslation();
  const { actor } = useGitHub();
  const { problem, run } = useGitHubAction();
  const protection = branch.protection;
  const save = (next: BranchProtection | null) =>
    run((actions, state) =>
      actions.updateBranchProtection.execute(state, {
        repository: project.url,
        branch: branch.name,
        protection: next,
        actor,
      }),
    );
  const approvalsId = useId();
  const actionLabel =
    protection === null ? t('github.settings.protect') : t('github.settings.unprotect');

  return (
    <Box className="flex flex-col gap-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle>
          <span className="font-mono">{branch.name}</span>
        </SectionTitle>
        <Button
          variant={protection === null ? 'primary' : 'danger'}
          aria-label={`${actionLabel} ${branch.name}`}
          disabled={disabled}
          onClick={() => save(protection === null ? DEFAULT_BRANCH_PROTECTION : null)}
        >
          {actionLabel}
        </Button>
      </div>
      {protection !== null && (
        <div className="flex flex-col gap-2">
          <label className="text-ink flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1"
              disabled={disabled}
              checked={protection.requirePullRequest}
              onChange={() =>
                save({ ...protection, requirePullRequest: !protection.requirePullRequest })
              }
            />
            <span>
              {t('github.settings.requirePullRequest')}
              <span className="text-ink-muted block text-xs">
                <RichText text={t('github.settings.requirePullRequestHint')} />
              </span>
            </span>
          </label>
          <div className="flex items-center gap-2 pl-6">
            <label htmlFor={approvalsId} className="text-ink text-sm">
              {t('github.settings.requiredApprovals')}
            </label>
            <select
              id={approvalsId}
              disabled={disabled}
              value={protection.requiredApprovals}
              onChange={(event) =>
                save({ ...protection, requiredApprovals: Number(event.target.value) })
              }
              className="border-rule bg-canvas text-ink rounded-md border px-2 py-1 text-sm"
            >
              {APPROVAL_CHOICES.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>
          <label className="text-ink flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1"
              disabled={disabled}
              checked={protection.requireStatusChecks}
              onChange={() =>
                save({ ...protection, requireStatusChecks: !protection.requireStatusChecks })
              }
            />
            <span>
              {t('github.settings.requireStatusChecks')}
              <span className="text-ink-muted block text-xs">
                <RichText text={t('github.settings.requireStatusChecksHint')} />
              </span>
            </span>
          </label>
          <p className="text-ink-muted text-xs">{t('github.settings.alwaysBlocked')}</p>
        </div>
      )}
      <ProblemAlert problem={problem} />
    </Box>
  );
}

/** Branch protection rules; everyone can read them, only the owner can change them. */
export function SettingsTab({ project }: { readonly project: HostedProject }) {
  const { t } = useTranslation();
  const { hosting, actor } = useGitHub();
  const branches = useMemo(
    () => getRepositoryBranches(hosting, project.url),
    [hosting, project.url],
  );
  const isOwner = actor.id === project.owner;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-ink-muted">
        <RichText text={t('github.settings.intro')} />
      </p>
      {!isOwner && (
        <p className="text-status-modified text-sm">
          {t('github.settings.ownerOnly', { owner: project.owner })}
        </p>
      )}
      {branches.length === 0 ? (
        <EmptyState>{t('github.emptyRepository')}</EmptyState>
      ) : (
        branches.map((branch) => (
          <ProtectionRule key={branch.name} project={project} branch={branch} disabled={!isOwner} />
        ))
      )}
    </div>
  );
}
