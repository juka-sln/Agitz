import { useMemo } from 'react';

import { getRepositoryBranches } from '@/application/queries/getGitHubViews';
import { findProject, type HostedProject } from '@/domain/entities/GitHub';
import { findHostedRepository } from '@/domain/entities/Network';
import { shortHash } from '@/domain/value-objects/Hash';

import { useGitHub, useGitHubAction } from '../../hooks/useGitHub';
import { useTranslation } from '../../hooks/useTranslation';
import { useGitHubStore } from '../../stores/githubStore';
import { RichText } from '../docs/RichText';

import { ChecksBadge } from './ChecksBadge';
import { CommandSnippet } from './CommandSnippet';
import { Badge, Box, Button, ProblemAlert, SectionTitle } from './ui';

function QuickSetup({ url }: { readonly url: string }) {
  const { t } = useTranslation();
  return (
    <Box className="flex flex-col gap-2 p-3">
      <SectionTitle>{t('github.quickSetup')}</SectionTitle>
      <p className="text-ink-muted">{t('github.quickSetupIntro')}</p>
      <CommandSnippet command={`git remote add origin ${url}`} />
      <CommandSnippet command="git push -u origin main" />
    </Box>
  );
}

export function CodeTab({ project }: { readonly project: HostedProject }) {
  const { t } = useTranslation();
  const { hosting } = useGitHub();
  const { problem, run } = useGitHubAction();
  const navigate = useGitHubStore((state) => state.navigate);
  const branches = useMemo(
    () => getRepositoryBranches(hosting, project.url),
    [hosting, project.url],
  );
  const tags = Object.keys(findHostedRepository(hosting.network, project.url)?.tags ?? {}).sort();
  const parent = project.parent === null ? undefined : findProject(hosting.github, project.parent);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <SectionTitle>{t('github.cloneTitle')}</SectionTitle>
        <CommandSnippet command={`git clone ${project.url}`} />
        {parent !== undefined && (
          <>
            <p className="text-ink-muted text-xs">
              <RichText text={t('github.upstreamHint')} />
            </p>
            <CommandSnippet command={`git remote add upstream ${parent.url}`} />
          </>
        )}
      </section>

      {branches.length === 0 ? (
        <QuickSetup url={project.url} />
      ) : (
        <section className="flex flex-col gap-2">
          <SectionTitle>{t('github.branches', { count: branches.length })}</SectionTitle>
          <ul
            aria-label={t('hosted.branches')}
            className="border-rule divide-rule divide-y rounded-md border"
          >
            {branches.map((branch) => (
              <li key={branch.name} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <span className="text-ink font-mono font-semibold">{branch.name}</span>
                {branch.isDefault && <Badge tone="neutral">{t('github.default')}</Badge>}
                {branch.protection !== null && (
                  <Badge tone="neutral">{t('github.protected')}</Badge>
                )}
                <ChecksBadge conclusion={branch.checks} />
                <span className="text-ink-muted min-w-0 flex-1 truncate text-xs">
                  <span className="font-mono">{shortHash(branch.tip)}</span> {branch.subject}
                </span>
                {!branch.isDefault &&
                  (branch.openPullRequest === null ? (
                    <Button
                      variant="primary"
                      onClick={() => {
                        navigate({ page: 'newPull', head: branch.name });
                      }}
                    >
                      {t('github.compareAndPullRequest')}
                    </Button>
                  ) : (
                    <Button
                      variant="quiet"
                      onClick={() => {
                        navigate({ page: 'pull', number: branch.openPullRequest ?? 0 });
                      }}
                    >
                      #{branch.openPullRequest}
                    </Button>
                  ))}
                {!branch.isDefault && branch.protection === null && (
                  <Button
                    variant="danger"
                    aria-label={`${t('github.deleteBranch')} ${branch.name}`}
                    onClick={() =>
                      run((actions, state) =>
                        actions.deleteBranch.execute(state, {
                          repository: project.url,
                          branch: branch.name,
                        }),
                      )
                    }
                  >
                    {t('github.deleteBranch')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <ProblemAlert problem={problem} />
        </section>
      )}

      {tags.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionTitle>{t('github.tags')}</SectionTitle>
          <ul className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag}>
                <Badge tone="neutral">{tag}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
