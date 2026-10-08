import { useMemo, useState, type FormEvent } from 'react';

import { findIssue, nextItemNumber, type HostedProject } from '@/domain/entities/GitHub';
import { DEFAULT_LABELS } from '@/domain/entities/Issue';

import { useGitHub, useGitHubAction } from '../../hooks/useGitHub';
import { useTranslation } from '../../hooks/useTranslation';
import { useGitHubStore, type GitHubView } from '../../stores/githubStore';
import { RichText } from '../docs/RichText';

import { Badge, Box, Button, EmptyState, ProblemAlert, TextField } from './ui';

function LabelPicker({
  selected,
  onToggle,
}: {
  readonly selected: readonly string[];
  readonly onToggle: (label: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <fieldset className="flex flex-wrap gap-x-3 gap-y-1">
      <legend className="text-ink mb-1 text-xs font-semibold">{t('github.issues.labels')}</legend>
      {DEFAULT_LABELS.map((label) => (
        <label key={label} className="text-ink flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(label)}
            onChange={() => {
              onToggle(label);
            }}
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}

const toggle = (labels: readonly string[], label: string) =>
  labels.includes(label) ? labels.filter((name) => name !== label) : [...labels, label];

function NewIssueForm({ project }: { readonly project: HostedProject }) {
  const { t } = useTranslation();
  const { hosting, actor } = useGitHub();
  const { problem, run, clearProblem } = useGitHubAction();
  const navigate = useGitHubStore((state) => state.navigate);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [labels, setLabels] = useState<readonly string[]>([]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const number = nextItemNumber(hosting.github, project.url);
    if (
      run((actions, state) =>
        actions.createIssue.execute(state, {
          repository: project.url,
          title,
          body,
          labels,
          author: actor,
        }),
      )
    ) {
      navigate({ page: 'issue', number });
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <h3 className="text-ink text-base font-bold">{t('github.issues.new')}</h3>
      <TextField
        label={t('github.issues.titleLabel')}
        value={title}
        onChange={(value) => {
          setTitle(value);
          clearProblem();
        }}
      />
      <TextField label={t('github.issues.bodyLabel')} value={body} multiline onChange={setBody} />
      <LabelPicker
        selected={labels}
        onToggle={(label) => {
          setLabels(toggle(labels, label));
        }}
      />
      <ProblemAlert problem={problem} />
      <div>
        <Button type="submit" variant="primary">
          {t('github.issues.submit')}
        </Button>
      </div>
    </form>
  );
}

function IssueView({
  project,
  number,
}: {
  readonly project: HostedProject;
  readonly number: number;
}) {
  const { t } = useTranslation();
  const { hosting } = useGitHub();
  const { problem, run } = useGitHubAction();
  const issue = findIssue(hosting.github, project.url, number);
  if (issue === undefined) {
    return <EmptyState>{t('github.problem.issueNotFound', { number })}</EmptyState>;
  }
  const update = (change: { state?: 'open' | 'closed'; labels?: readonly string[] }) =>
    run((actions, state) =>
      actions.updateIssue.execute(state, { repository: project.url, number, ...change }),
    );

  return (
    <article className="flex flex-col gap-3" aria-labelledby={`issue-${String(number)}`}>
      <h3 id={`issue-${String(number)}`} className="text-ink text-lg font-bold">
        {issue.title} <span className="text-ink-muted font-normal">#{issue.number}</span>
      </h3>
      <p className="text-ink-muted flex flex-wrap items-center gap-2 text-xs">
        <Badge tone={issue.state === 'open' ? 'open' : 'merged'}>
          {t(issue.state === 'open' ? 'github.state.open' : 'github.state.closed')}
        </Badge>
        {t('github.issues.openedBy', { author: issue.author.id })}
      </p>
      {issue.closedByPullRequest !== null && (
        <p className="text-ink text-sm">
          {t('github.issues.closedBy', { number: issue.closedByPullRequest })}
        </p>
      )}
      <Box className="text-ink px-3 py-2 whitespace-pre-wrap">
        {issue.body === '' ? (
          <span className="text-ink-muted italic">{t('github.pull.noDescription')}</span>
        ) : (
          issue.body
        )}
      </Box>
      <LabelPicker
        selected={issue.labels}
        onToggle={(label) => update({ labels: toggle(issue.labels, label) })}
      />
      <p className="text-ink-muted text-xs">
        <RichText text={t('github.issues.closingHint', { number })} />
      </p>
      <div>
        <Button onClick={() => update({ state: issue.state === 'open' ? 'closed' : 'open' })}>
          {issue.state === 'open' ? t('github.issues.close') : t('github.issues.reopen')}
        </Button>
      </div>
      <ProblemAlert problem={problem} />
    </article>
  );
}

function IssueList({ project }: { readonly project: HostedProject }) {
  const { t } = useTranslation();
  const { hosting } = useGitHub();
  const navigate = useGitHubStore((state) => state.navigate);
  const issues = useMemo(
    () => hosting.github.issues.filter((issue) => issue.repository === project.url).toReversed(),
    [hosting.github.issues, project.url],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-ink-muted">{t('github.issues.intro')}</p>
        <Button
          variant="primary"
          onClick={() => {
            navigate({ page: 'newIssue' });
          }}
        >
          {t('github.issues.new')}
        </Button>
      </div>
      {issues.length === 0 ? (
        <EmptyState>{t('github.issues.empty')}</EmptyState>
      ) : (
        <ul className="border-rule divide-rule divide-y rounded-md border">
          {issues.map((issue) => (
            <li key={issue.number}>
              <button
                type="button"
                onClick={() => {
                  navigate({ page: 'issue', number: issue.number });
                }}
                className="hover:bg-surface-raised flex w-full flex-wrap items-center gap-2 px-3 py-2 text-left"
              >
                <Badge tone={issue.state === 'open' ? 'open' : 'merged'}>
                  {t(issue.state === 'open' ? 'github.state.open' : 'github.state.closed')}
                </Badge>
                <span className="text-ink min-w-0 flex-1 font-semibold">
                  {issue.title} <span className="text-ink-muted font-normal">#{issue.number}</span>
                </span>
                {issue.labels.map((label) => (
                  <Badge key={label} tone="neutral">
                    {label}
                  </Badge>
                ))}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function IssuesTab({
  project,
  view,
}: {
  readonly project: HostedProject;
  readonly view: GitHubView;
}) {
  if (view.page === 'newIssue') {
    return <NewIssueForm project={project} />;
  }
  if (view.page === 'issue') {
    return <IssueView project={project} number={view.number} />;
  }
  return <IssueList project={project} />;
}
