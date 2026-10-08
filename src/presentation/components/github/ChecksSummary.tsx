import type { CheckProblem, WorkflowRun } from '@/domain/entities/WorkflowRun';
import { shortHash } from '@/domain/value-objects/Hash';

import { useTranslation } from '../../hooks/useTranslation';
import { RichText } from '../docs/RichText';

import { ChecksBadge } from './ChecksBadge';

function ProblemText({ problem }: { readonly problem: CheckProblem }) {
  const { t } = useTranslation();
  return problem.kind === 'commitNotConventional' ? (
    <RichText
      text={t('github.checks.commitNotConventional', {
        commit: shortHash(problem.commit),
        subject: problem.subject,
      })}
    />
  ) : (
    <RichText text={t('github.checks.conflictMarkers', { path: problem.path })} />
  );
}

/** The jobs of a workflow run, with what made each failing one fail. */
export function WorkflowJobs({ run }: { readonly run: WorkflowRun }) {
  const { t } = useTranslation();
  return (
    <ul className="flex flex-col gap-1.5">
      {run.jobs.map((job) => (
        <li key={job.name}>
          <p className="flex items-center gap-2">
            <ChecksBadge conclusion={job.conclusion} />
            <span className="text-ink font-mono text-xs font-semibold">{job.name}</span>
            <span className="text-ink-muted text-xs">{t(`github.job.${job.name}`)}</span>
          </p>
          {job.problems.length > 0 && (
            <ul className="text-ink mt-1 list-disc space-y-0.5 pl-9 text-xs">
              {job.problems.map((problem, index) => (
                <li key={index}>
                  <ProblemText problem={problem} />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ChecksSummary({ run }: { readonly run: WorkflowRun | null }) {
  const { t } = useTranslation();
  if (run === null) {
    return (
      <p className="text-ink-muted text-xs">
        <RichText text={t('github.checks.none')} />
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-ink font-semibold">
        {run.conclusion === 'success'
          ? t('github.checks.allPassed')
          : t('github.checks.someFailed')}
      </p>
      <WorkflowJobs run={run} />
    </div>
  );
}
