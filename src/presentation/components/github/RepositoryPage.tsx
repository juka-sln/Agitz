import type { RefObject } from 'react';

import {
  findProject,
  projectFullName,
  repositoryUrl,
  type HostedProject,
} from '@/domain/entities/GitHub';

import { useGitHub, useGitHubAction } from '../../hooks/useGitHub';
import { useTranslation } from '../../hooks/useTranslation';
import type { MessageKey } from '../../i18n/messages';
import { tabOf, useGitHubStore, type GitHubTab } from '../../stores/githubStore';

import { ActionsTab } from './ActionsTab';
import { CodeTab } from './CodeTab';
import { IssuesTab } from './IssuesTab';
import { PullRequestsTab } from './PullRequestsTab';
import { SettingsTab } from './SettingsTab';
import { Button, ProblemAlert } from './ui';

const TABS: readonly { readonly tab: GitHubTab; readonly label: MessageKey }[] = [
  { tab: 'code', label: 'github.tab.code' },
  { tab: 'pulls', label: 'github.tab.pulls' },
  { tab: 'issues', label: 'github.tab.issues' },
  { tab: 'actions', label: 'github.tab.actions' },
  { tab: 'settings', label: 'github.tab.settings' },
];

function ForkButton({ project }: { readonly project: HostedProject }) {
  const { t } = useTranslation();
  const { hosting, actor } = useGitHub();
  const { problem, run } = useGitHubAction();
  const open = useGitHubStore((state) => state.open);
  if (project.owner === actor.id) {
    return null;
  }
  const forkUrl = repositoryUrl(actor.id, project.name);
  const existing = findProject(hosting.github, forkUrl);

  if (existing?.parent === project.url) {
    return (
      <Button
        onClick={() => {
          open(forkUrl);
        }}
      >
        {t('github.yourFork', { name: projectFullName(existing) })}
      </Button>
    );
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={() => {
          if (
            run((actions, state) =>
              actions.forkRepository.execute(state, { url: project.url, owner: actor }),
            )
          ) {
            open(forkUrl);
          }
        }}
      >
        {t('github.fork')}
      </Button>
      <ProblemAlert problem={problem} />
    </div>
  );
}

export function RepositoryPage({
  project,
  title,
  headingRef,
}: {
  readonly project: HostedProject;
  readonly title: string;
  readonly headingRef: RefObject<HTMLHeadingElement>;
}) {
  const { t } = useTranslation();
  const { hosting } = useGitHub();
  const view = useGitHubStore((state) => state.view);
  const open = useGitHubStore((state) => state.open);
  const navigate = useGitHubStore((state) => state.navigate);
  const currentTab = tabOf(view);
  const parent = project.parent === null ? undefined : findProject(hosting.github, project.parent);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-ink font-mono text-lg font-bold break-all"
          >
            {title}
          </h2>
          {parent !== undefined && (
            <p className="text-ink-muted text-xs">
              {t('github.forkedFromPrefix')}{' '}
              <button
                type="button"
                className="text-ink font-mono underline underline-offset-2"
                onClick={() => {
                  open(parent.url);
                }}
              >
                {projectFullName(parent)}
              </button>
            </p>
          )}
        </div>
        <ForkButton project={project} />
      </div>
      <nav aria-label={t('github.repositoryNavigation')} className="border-rule mt-3 border-b">
        <ul className="-mb-px flex flex-wrap gap-1">
          {TABS.map(({ tab, label }) => (
            <li key={tab}>
              <button
                type="button"
                aria-current={currentTab === tab ? 'page' : undefined}
                onClick={() => {
                  navigate({ page: tab });
                }}
                className={`border-b-2 px-2.5 py-1.5 text-sm font-semibold ${
                  currentTab === tab
                    ? 'text-ink border-(--line-5)'
                    : 'text-ink-muted hover:text-ink border-transparent'
                }`}
              >
                {t(label)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="pt-4">
        {currentTab === 'code' && <CodeTab project={project} />}
        {currentTab === 'pulls' && <PullRequestsTab project={project} view={view} />}
        {currentTab === 'issues' && <IssuesTab project={project} view={view} />}
        {currentTab === 'actions' && <ActionsTab project={project} />}
        {currentTab === 'settings' && <SettingsTab project={project} />}
      </div>
    </div>
  );
}
