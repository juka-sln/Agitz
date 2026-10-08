import { CheckoutCommand } from '@/application/git-commands/CheckoutCommand';
import { PullCommand } from '@/application/git-commands/PullCommand';
import { PushCommand } from '@/application/git-commands/PushCommand';
import { DEFAULT_BRANCH_PROTECTION } from '@/domain/entities/BranchProtection';
import { setBranchProtection } from '@/domain/entities/Network';
import type { MergeMethod } from '@/domain/entities/PullRequest';
import { getCommit } from '@/domain/entities/Repository';
import type { Hash } from '@/domain/value-objects/Hash';
import { FEATURE, MAIN, openPullRequest } from '@/test/fixtures/pullRequestScenario';
import { ALICE_ACCOUNT, BOB_ACCOUNT, ORIGIN_URL } from '@/test/fixtures/TeamBench';

import { CreateIssue } from './CreateIssue';
import { MergePullRequest } from './MergePullRequest';
import { ReviewPullRequest } from './ReviewPullRequest';

const TWO_COMMITS = [
  ['feat: add greeting', { 'hello.txt': 'Hello\n' }],
  ['docs: explain greeting', { 'README.md': 'Hello\nSay hello.\n' }],
] as const;

type Team = ReturnType<typeof openPullRequest>;

function hostedCommit(team: Team, hash: Hash | undefined) {
  if (hash === undefined) {
    throw new Error('No such commit on the hosted repository');
  }
  return getCommit(team.hosted, hash);
}

/** The commit a branch of the hosted repository points to. */
function hostedTip(team: Team, branch: string) {
  return hostedCommit(team, team.hosted.branches[branch]);
}

describe('MergePullRequest', () => {
  function merge(team: Team, method: MergeMethod) {
    return team.web((state) =>
      new MergePullRequest(team.context).execute(state, {
        repository: ORIGIN_URL,
        number: 1,
        method,
        actor: ALICE_ACCOUNT,
      }),
    );
  }

  it('creates a merge commit with both tips as parents', () => {
    const team = openPullRequest(TWO_COMMITS);
    const baseTip = team.hosted.branches.main;
    const headTip = team.hosted.branches[FEATURE];

    expect(merge(team, 'merge').ok).toBe(true);
    const commit = hostedTip(team, MAIN);
    expect(commit.parents).toEqual([baseTip, headTip]);
    expect(commit.message).toBe(
      'Merge pull request #1 from alice/feature/greeting\n\nfeat: add greeting',
    );
    expect(commit.author).toEqual(ALICE_ACCOUNT.identity);
    expect(commit.committer).toEqual({ name: 'GitHub', email: 'noreply@github.com' });
    expect(team.github.pullRequests[0]?.state).toBe('merged');
    expect(team.github.pullRequests[0]?.merge).toMatchObject({
      method: 'merge',
      commit: commit.hash,
      headCommit: headTip,
      baseCommit: baseTip,
    });
  });

  it('squashes the branch into a single commit authored by the pull request author', () => {
    const team = openPullRequest(TWO_COMMITS);
    const baseTip = team.hosted.branches.main;
    merge(team, 'squash');

    const commit = hostedTip(team, MAIN);
    expect(commit.parents).toEqual([baseTip]);
    expect(commit.message).toBe(
      'feat: add greeting (#1)\n\n* feat: add greeting\n* docs: explain greeting',
    );
    expect(commit.author).toEqual(BOB_ACCOUNT.identity);
    expect(commit.tree).toEqual(hostedTip(team, FEATURE).tree);
  });

  it('rebases each commit on top of the base with new hashes', () => {
    const team = openPullRequest(TWO_COMMITS);
    team.alice.commit('fix: typo', { 'NOTES.md': 'notes\n' });
    team.online(team.alice, new PushCommand(), {});
    const baseTip = team.hosted.branches.main;
    merge(team, 'rebase');

    const tip = hostedTip(team, MAIN);
    const first = hostedCommit(team, tip.parents[0]);
    expect(tip.message).toBe('docs: explain greeting');
    expect(first.message).toBe('feat: add greeting');
    expect(first.parents).toEqual([baseTip]);
    expect(tip.author).toEqual(team.bob.headCommit.author);
    expect(tip.hash).not.toBe(team.bob.headCommit.hash);
    expect(Object.keys(tip.tree).sort()).toEqual(['NOTES.md', 'README.md', 'hello.txt']);
  });

  it('lets teammates pull the merged work', () => {
    const team = openPullRequest();
    merge(team, 'merge');
    team.alice.run(new CheckoutCommand(team.context), { targets: ['main'] });
    team.online(team.alice, new PullCommand(team.context), {});

    expect(team.alice.workspace.files['hello.txt']).toBe('Hello\n');
  });

  it('refuses conflicting branches', () => {
    const team = openPullRequest([['feat: greet', { 'README.md': 'Hi from Bob\n' }]]);
    team.alice.commit('docs: reword', { 'README.md': 'Hi from Alice\n' });
    team.online(team.alice, new PushCommand(), {});

    expect(merge(team, 'merge')).toEqual({
      ok: false,
      problem: { code: 'mergeBlocked', params: { reason: 'conflicts' } },
    });
    expect(team.github.pullRequests[0]?.state).toBe('open');
  });

  it('waits for the approvals a protected base branch requires', () => {
    const team = openPullRequest();
    team.network = setBranchProtection(team.network, ORIGIN_URL, MAIN, DEFAULT_BRANCH_PROTECTION);
    expect(merge(team, 'merge')).toEqual({
      ok: false,
      problem: { code: 'mergeBlocked', params: { reason: 'approvals' } },
    });

    team.web((state) =>
      new ReviewPullRequest().execute(state, {
        repository: ORIGIN_URL,
        number: 1,
        reviewer: ALICE_ACCOUNT,
        verdict: 'approve',
        body: '',
      }),
    );
    expect(merge(team, 'merge').ok).toBe(true);
  });

  it('closes the issues the description references', () => {
    const team = openPullRequest(undefined, { body: 'Closes #2' });
    // #1 is the pull request: the issue created next gets #2.
    team.web((state) =>
      new CreateIssue().execute(state, {
        repository: ORIGIN_URL,
        title: 'Say hello',
        body: '',
        labels: ['enhancement'],
        author: ALICE_ACCOUNT,
      }),
    );
    merge(team, 'squash');

    expect(team.github.issues[0]).toMatchObject({
      number: 2,
      state: 'closed',
      closedByPullRequest: 1,
    });
  });
});
