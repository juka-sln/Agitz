import { ForkRepository } from '@/application/github-features/ForkRepository';
import { MergePullRequest } from '@/application/github-features/MergePullRequest';
import { getPullRequestStatus } from '@/application/github-features/support/comparePullRequest';
import { DEFAULT_BRANCH_PROTECTION } from '@/domain/entities/BranchProtection';
import { setBranchProtection } from '@/domain/entities/Network';
import { FEATURE, openPullRequest } from '@/test/fixtures/pullRequestScenario';
import { ALICE_ACCOUNT, BOB_ACCOUNT, ORIGIN_URL } from '@/test/fixtures/TeamBench';

import {
  getBaseRepositories,
  getHeadRepositories,
  getProjects,
  getPullRequestChanges,
  getRepositoryBranches,
} from './getGitHubViews';

const FORK_URL = 'https://github.com/bob/project.git';

describe('GitHub views', () => {
  it('summarizes projects with their fork parent and open items', () => {
    const team = openPullRequest();
    team.web((state) =>
      new ForkRepository().execute(state, { url: ORIGIN_URL, owner: BOB_ACCOUNT }),
    );

    expect(getProjects(team.hosting)).toMatchObject([
      {
        fullName: 'alice/project',
        parentFullName: null,
        defaultBranch: 'main',
        openPullRequests: 1,
      },
      { fullName: 'bob/project', parentFullName: 'alice/project', openPullRequests: 0 },
    ]);
    expect(getBaseRepositories(team.hosting, FORK_URL).map((repository) => repository.url)).toEqual(
      [FORK_URL, ORIGIN_URL],
    );
    expect(
      getHeadRepositories(team.hosting, ORIGIN_URL).map((repository) => repository.url),
    ).toEqual([ORIGIN_URL, FORK_URL]);
  });

  it('lists branches with protection and pull request links', () => {
    const team = openPullRequest();
    team.network = setBranchProtection(team.network, ORIGIN_URL, 'main', DEFAULT_BRANCH_PROTECTION);

    expect(getRepositoryBranches(team.hosting, ORIGIN_URL)).toMatchObject([
      {
        name: 'main',
        isDefault: true,
        protection: DEFAULT_BRANCH_PROTECTION,
        openPullRequest: null,
      },
      { name: FEATURE, isDefault: false, protection: null, openPullRequest: 1, checks: null },
    ]);
  });

  it('describes the commits and files of a pull request, before and after the merge', () => {
    const team = openPullRequest([
      ['feat: add greeting', { 'hello.txt': 'Hello\n' }],
      ['feat: greet louder', { 'hello.txt': 'HELLO\n' }],
    ]);
    const pullRequest = () => team.github.pullRequests[0];
    const changes = () => {
      const current = pullRequest();
      if (current === undefined) {
        throw new Error('missing pull request');
      }
      return getPullRequestChanges(
        team.hosting,
        current,
        getPullRequestStatus(team.context.hasher, team.hosting, current),
      );
    };
    const expected = {
      commits: [
        { subject: 'feat: add greeting', author: 'Bob' },
        { subject: 'feat: greet louder', author: 'Bob' },
      ],
      files: [
        {
          path: 'hello.txt',
          type: 'added',
          additions: 1,
          deletions: 0,
          lines: [{ type: 'added', line: 'HELLO' }],
        },
      ],
    };
    expect(changes()).toMatchObject(expected);

    team.web((state) =>
      new MergePullRequest(team.context).execute(state, {
        repository: ORIGIN_URL,
        number: 1,
        method: 'squash',
        actor: ALICE_ACCOUNT,
      }),
    );
    expect(changes()).toMatchObject(expected);
  });
});
