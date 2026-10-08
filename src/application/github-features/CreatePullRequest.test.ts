import { CheckoutCommand } from '@/application/git-commands/CheckoutCommand';
import { PushCommand } from '@/application/git-commands/PushCommand';
import { RemoteCommand } from '@/application/git-commands/RemoteCommand';
import { ForkRepository } from '@/application/github-features/ForkRepository';
import type { BranchName } from '@/domain/value-objects/BranchName';
import { FEATURE, MAIN, openPullRequest } from '@/test/fixtures/pullRequestScenario';
import { BOB_ACCOUNT, ORIGIN_URL, TeamBench } from '@/test/fixtures/TeamBench';

import { CreatePullRequest, type CreatePullRequestInput } from './CreatePullRequest';

const FORK_URL = 'https://github.com/bob/project.git';

describe('CreatePullRequest', () => {
  const create = new CreatePullRequest();
  const input: CreatePullRequestInput = {
    repository: ORIGIN_URL,
    base: MAIN,
    head: { repository: ORIGIN_URL, branch: FEATURE },
    title: 'feat: add greeting',
    body: '',
    author: BOB_ACCOUNT,
  };

  it('opens pull request #1 on the base repository', () => {
    const team = openPullRequest();
    expect(team.github.pullRequests).toEqual([
      {
        repository: ORIGIN_URL,
        number: 1,
        title: 'feat: add greeting',
        body: 'Greets the visitor.',
        author: BOB_ACCOUNT,
        base: 'main',
        head: { repository: ORIGIN_URL, branch: FEATURE },
        state: 'open',
        reviews: [],
        merge: null,
      },
    ]);
  });

  it('opens a pull request from a fork to the original repository', () => {
    const team = new TeamBench().share();
    team.web((state) =>
      new ForkRepository().execute(state, { url: ORIGIN_URL, owner: BOB_ACCOUNT }),
    );
    team.bob.run(new RemoteCommand(), { action: 'rename', oldName: 'origin', newName: 'upstream' });
    team.bob.run(new RemoteCommand(), { action: 'add', name: 'origin', url: FORK_URL });
    team.bob.run(new CheckoutCommand(team.context), { targets: [], newBranch: FEATURE });
    team.bob.commit('feat: add greeting', { 'hello.txt': 'Hello\n' });
    team.online(team.bob, new PushCommand(), { remote: 'origin', refspecs: [FEATURE] });

    const result = team.web((state) =>
      create.execute(state, { ...input, head: { repository: FORK_URL, branch: FEATURE } }),
    );
    expect(result.ok).toBe(true);
    expect(team.github.pullRequests[0]?.head).toEqual({ repository: FORK_URL, branch: FEATURE });
  });

  it.each<[string, Partial<CreatePullRequestInput>]>([
    ['titleRequired', { title: '  ' }],
    ['sameBranch', { head: { repository: ORIGIN_URL, branch: MAIN } }],
    ['branchNotFound', { head: { repository: ORIGIN_URL, branch: 'nope' as BranchName } }],
  ])('refuses with %s', (code, override) => {
    const team = openPullRequest();
    const result = team.web((state) => create.execute(state, { ...input, ...override }));
    expect(result.ok ? null : result.problem.code).toBe(code);
  });

  it('refuses a duplicate or a branch with nothing new', () => {
    const team = openPullRequest();
    expect(team.web((state) => create.execute(state, input))).toEqual({
      ok: false,
      problem: { code: 'pullRequestExists', params: { number: 1 } },
    });

    const empty = new TeamBench().share();
    empty.bob.run(new CheckoutCommand(empty.context), { targets: [], newBranch: FEATURE });
    empty.online(empty.bob, new PushCommand(), { remote: 'origin', refspecs: [FEATURE] });
    expect(empty.web((state) => create.execute(state, input))).toEqual({
      ok: false,
      problem: { code: 'nothingToCompare', params: { base: 'main', head: FEATURE } },
    });
  });
});
