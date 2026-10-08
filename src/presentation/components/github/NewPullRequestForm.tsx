import { useMemo, useState, type FormEvent } from 'react';

import { getBaseRepositories, getHeadRepositories } from '@/application/queries/getGitHubViews';
import { nextItemNumber, type HostedProject } from '@/domain/entities/GitHub';
import { findHostedRepository } from '@/domain/entities/Network';
import type { BranchName } from '@/domain/value-objects/BranchName';

import { useGitHub, useGitHubAction } from '../../hooks/useGitHub';
import { useTranslation } from '../../hooks/useTranslation';
import { useGitHubStore } from '../../stores/githubStore';
import { RichText } from '../docs/RichText';

import { ChangeList } from './ChangeList';
import { Box, Button, EmptyState, ProblemAlert, SelectField, TextField } from './ui';

function defaultBranchOf(hosting: ReturnType<typeof useGitHub>['hosting'], url: string): string {
  const head = findHostedRepository(hosting.network, url)?.head;
  return head?.type === 'attached' ? head.branch : 'main';
}

/** GitHub's "Comparing changes" page: pick what to merge where, check it, then describe it. */
export function NewPullRequestForm({
  project,
  head: requestedHead,
}: {
  readonly project: HostedProject;
  readonly head?: string | undefined;
}) {
  const { t } = useTranslation();
  const { hosting, actor, actions } = useGitHub();
  const { problem, run, clearProblem } = useGitHubAction();
  const open = useGitHubStore((state) => state.open);
  const navigate = useGitHubStore((state) => state.navigate);

  const bases = useMemo(() => getBaseRepositories(hosting, project.url), [hosting, project.url]);
  // From a fork, GitHub proposes the changes to the original repository.
  const [baseUrl, setBaseUrl] = useState(project.parent ?? project.url);
  const [base, setBase] = useState(() => defaultBranchOf(hosting, project.parent ?? project.url));
  const heads = useMemo(() => getHeadRepositories(hosting, baseUrl), [hosting, baseUrl]);
  const [headUrl, setHeadUrl] = useState(project.url);
  const headBranches = heads.find((candidate) => candidate.url === headUrl)?.branches ?? [];
  const [head, setHead] = useState(
    requestedHead ??
      headBranches.find((branch) => branch !== defaultBranchOf(hosting, project.url)) ??
      '',
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const preview = useMemo(
    () =>
      head === ''
        ? null
        : actions.previewPullRequest(hosting, baseUrl, base, {
            repository: headUrl,
            branch: head as BranchName,
          }),
    [actions, hosting, baseUrl, base, headUrl, head],
  );
  const suggestedTitle = preview?.commits.length === 1 ? (preview.commits[0]?.subject ?? '') : head;
  const baseBranches = bases.find((candidate) => candidate.url === baseUrl)?.branches ?? [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const number = nextItemNumber(hosting.github, baseUrl);
    const created = run((all, state) =>
      all.createPullRequest.execute(state, {
        repository: baseUrl,
        base: base as BranchName,
        head: { repository: headUrl, branch: head as BranchName },
        title: title.trim() === '' ? suggestedTitle : title,
        body,
        author: actor,
      }),
    );
    if (created) {
      if (baseUrl === project.url) {
        navigate({ page: 'pull', number });
      } else {
        open(baseUrl, { page: 'pull', number });
      }
    }
  };

  const options = (values: readonly string[]) => values.map((value) => ({ value, label: value }));
  const repositoryOptions = (list: typeof bases) =>
    list.map((candidate) => ({ value: candidate.url, label: candidate.fullName }));

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-ink text-base font-bold">{t('github.newPull.title')}</h3>
        <p className="text-ink-muted">
          <RichText text={t('github.newPull.intro')} />
        </p>
      </div>
      <Box className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
        <SelectField
          label={t('github.newPull.baseRepository')}
          value={baseUrl}
          options={repositoryOptions(bases)}
          onChange={(value) => {
            setBaseUrl(value);
            setBase(defaultBranchOf(hosting, value));
            clearProblem();
          }}
        />
        <SelectField
          label={t('github.newPull.base')}
          value={base}
          options={options(baseBranches)}
          onChange={(value) => {
            setBase(value);
            clearProblem();
          }}
        />
        <SelectField
          label={t('github.newPull.headRepository')}
          value={headUrl}
          options={repositoryOptions(heads)}
          onChange={(value) => {
            setHeadUrl(value);
            setHead('');
            clearProblem();
          }}
        />
        <SelectField
          label={t('github.newPull.compare')}
          value={head}
          options={[{ value: '', label: '—' }, ...options(headBranches)]}
          onChange={(value) => {
            setHead(value);
            clearProblem();
          }}
        />
      </Box>

      {preview === null ? (
        <EmptyState>{t('github.newPull.chooseBranches')}</EmptyState>
      ) : preview.commits.length === 0 ? (
        <EmptyState>{t('github.newPull.nothingToCompare', { base, head })}</EmptyState>
      ) : (
        <>
          <p className={preview.mergeable ? 'text-status-staged' : 'text-status-modified'}>
            {preview.mergeable ? t('github.newPull.ableToMerge') : t('github.newPull.notMergeable')}
          </p>
          <TextField
            label={t('github.newPull.titleLabel')}
            value={title}
            placeholder={suggestedTitle}
            hint={t('github.newPull.titleHint')}
            onChange={(value) => {
              setTitle(value);
              clearProblem();
            }}
          />
          <TextField
            label={t('github.newPull.bodyLabel')}
            value={body}
            multiline
            placeholder={t('github.newPull.bodyPlaceholder')}
            onChange={(value) => {
              setBody(value);
            }}
          />
          <ProblemAlert problem={problem} />
          <div>
            <Button type="submit" variant="primary">
              {t('github.newPull.submit')}
            </Button>
          </div>
          <ChangeList changes={preview} />
        </>
      )}
    </form>
  );
}
