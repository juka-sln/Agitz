import { PushCommand } from '@/application/git-commands/PushCommand';
import { FEATURE, openPullRequest } from '@/test/fixtures/pullRequestScenario';
import { ORIGIN_URL } from '@/test/fixtures/TeamBench';

import { ClosePullRequest } from './ClosePullRequest';

describe('ClosePullRequest', () => {
  it('closes and reopens a pull request', () => {
    const team = openPullRequest();
    const close = new ClosePullRequest();
    team.web((state) => close.execute(state, { repository: ORIGIN_URL, number: 1 }));
    expect(team.github.pullRequests[0]?.state).toBe('closed');

    team.web((state) => close.execute(state, { repository: ORIGIN_URL, number: 1, reopen: true }));
    expect(team.github.pullRequests[0]?.state).toBe('open');
  });

  it('cannot reopen once the branch is deleted', () => {
    const team = openPullRequest();
    const close = new ClosePullRequest();
    team.web((state) => close.execute(state, { repository: ORIGIN_URL, number: 1 }));
    team.online(team.bob, new PushCommand(), {
      remote: 'origin',
      refspecs: [FEATURE],
      delete: true,
    });

    expect(
      team.web((state) =>
        close.execute(state, { repository: ORIGIN_URL, number: 1, reopen: true }),
      ),
    ).toMatchObject({ problem: { code: 'branchNotFound' } });
  });
});
