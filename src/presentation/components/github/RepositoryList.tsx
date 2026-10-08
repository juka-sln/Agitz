import { useMemo, useState, type FormEvent, type RefObject } from 'react';

import { getProjects } from '@/application/queries/getGitHubViews';
import { repositoryUrl } from '@/domain/entities/GitHub';

import { useGitHub, useGitHubAction } from '../../hooks/useGitHub';
import { useTranslation } from '../../hooks/useTranslation';
import { useGitHubStore } from '../../stores/githubStore';

import { Badge, Button, ProblemAlert, TextField } from './ui';

function NewRepositoryForm() {
  const { t } = useTranslation();
  const { actor } = useGitHub();
  const { problem, run, clearProblem } = useGitHubAction();
  const open = useGitHubStore((state) => state.open);
  const [name, setName] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (run((actions, state) => actions.createRepository.execute(state, { owner: actor, name }))) {
      open(repositoryUrl(actor.id, name.trim()));
    }
  };

  return (
    <form onSubmit={submit} className="border-rule mt-6 flex flex-col gap-2 border-t pt-4">
      <h3 className="text-ink text-sm font-bold">{t('github.newRepository')}</h3>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <TextField
            label={t('github.repositoryName', { owner: actor.id })}
            value={name}
            placeholder="website"
            onChange={(value) => {
              setName(value);
              clearProblem();
            }}
          />
        </div>
        <Button type="submit" variant="primary">
          {t('github.create')}
        </Button>
      </div>
      <ProblemAlert problem={problem} />
    </form>
  );
}

export function RepositoryList({
  headingRef,
}: {
  readonly headingRef: RefObject<HTMLHeadingElement>;
}) {
  const { t } = useTranslation();
  const { hosting } = useGitHub();
  const open = useGitHubStore((state) => state.open);
  const projects = useMemo(() => getProjects(hosting), [hosting]);

  return (
    <div>
      <h2 ref={headingRef} tabIndex={-1} className="text-ink text-xl font-bold">
        {t('github.repositories')}
      </h2>
      <p className="text-ink-muted mt-1">{t('github.repositoriesIntro')}</p>
      <ul className="mt-4 flex flex-col gap-2">
        {projects.map((summary) => (
          <li key={summary.project.url}>
            <button
              type="button"
              onClick={() => {
                open(summary.project.url);
              }}
              className="border-rule hover:bg-surface-raised flex w-full flex-col gap-0.5 rounded-md border px-3 py-2 text-left"
            >
              <span className="text-ink font-mono font-semibold">{summary.fullName}</span>
              {summary.parentFullName !== null && (
                <span className="text-ink-muted text-xs">
                  {t('github.forkedFrom', { parent: summary.parentFullName })}
                </span>
              )}
              <span className="text-ink-muted flex flex-wrap gap-x-3 text-xs">
                <span>
                  {summary.isEmpty
                    ? t('github.emptyRepository')
                    : t('github.defaultBranch', { branch: summary.defaultBranch ?? '' })}
                </span>
                <span>{t('github.openPullRequests', { count: summary.openPullRequests })}</span>
                <span>{t('github.openIssues', { count: summary.openIssues })}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {projects.length === 0 && <Badge tone="neutral">{t('github.noRepositories')}</Badge>}
      <NewRepositoryForm />
    </div>
  );
}
