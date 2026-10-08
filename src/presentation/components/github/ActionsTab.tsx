import { useMemo } from 'react';

import type { HostedProject } from '@/domain/entities/GitHub';
import { shortHash } from '@/domain/value-objects/Hash';

import { useGitHub } from '../../hooks/useGitHub';
import { useTranslation } from '../../hooks/useTranslation';
import { RichText } from '../docs/RichText';

import { WorkflowJobs } from './ChecksSummary';
import { CommandSnippet } from './CommandSnippet';
import { Badge, Box, EmptyState, SectionTitle } from './ui';

/** Simulated GitHub Actions: every push to a branch runs the CI workflow, newest run first. */
export function ActionsTab({ project }: { readonly project: HostedProject }) {
  const { t } = useTranslation();
  const { hosting } = useGitHub();
  const runs = useMemo(
    () => hosting.github.workflowRuns.filter((run) => run.repository === project.url).toReversed(),
    [hosting.github.workflowRuns, project.url],
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-muted">
        <RichText text={t('github.actions.intro')} />
      </p>
      {runs.length === 0 ? (
        <EmptyState>
          <div className="flex flex-col gap-2 text-left">
            <p>
              <RichText text={t('github.actions.empty')} />
            </p>
            <CommandSnippet command='echo "name: CI" > .github/workflows/ci.yml' />
            <CommandSnippet command="git add .github" />
            <CommandSnippet command='git commit -m "ci: add workflow"' />
            <CommandSnippet command="git push" />
          </div>
        </EmptyState>
      ) : (
        <ol className="flex flex-col gap-3">
          {runs.map((run) => (
            <li key={run.id}>
              <Box className="flex flex-col gap-2 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={run.conclusion === 'success' ? 'success' : 'failure'}>
                    {t(
                      run.conclusion === 'success'
                        ? 'github.checks.success'
                        : 'github.checks.failure',
                    )}
                  </Badge>
                  <SectionTitle>{t('github.actions.run', { id: run.id })}</SectionTitle>
                  <span className="text-ink-muted text-xs">
                    {t('github.actions.trigger', {
                      branch: run.branch,
                      commit: shortHash(run.commit),
                    })}
                  </span>
                </div>
                <WorkflowJobs run={run} />
              </Box>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
