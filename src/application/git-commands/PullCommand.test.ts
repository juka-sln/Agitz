import { commitSubject } from '@/domain/value-objects/CommitMessage';
import { shortHash } from '@/domain/value-objects/Hash';
import { GitTestBench } from '@/test/fixtures/GitTestBench';
import { ORIGIN_URL, TeamBench } from '@/test/fixtures/TeamBench';

import { CheckoutCommand } from './CheckoutCommand';
import { PullCommand } from './PullCommand';
import { PushCommand } from './PushCommand';
import { RemoteCommand } from './RemoteCommand';

const FROM = 'From https://github.com/alice/project';

describe('PullCommand', () => {
  /** Bob publishes a commit, so Alice's `main` is one commit behind `origin/main`. */
  function teamWithRemoteWork() {
    const team = new TeamBench().share();
    team.bob.commit('feat: add contributing guide', { 'CONTRIBUTING.md': 'Be kind\n' });
    team.online(team.bob, new PushCommand(), {});
    return team;
  }

  function pull(team: TeamBench, bench: GitTestBench, input = {}) {
    return team.online(bench, new PullCommand(team.context), input);
  }

  it('says when there is nothing new', () => {
    const team = new TeamBench().share();
    const result = pull(team, team.bob);

    expect(result.output).toBe('Already up to date.');
    expect(result.explanation.key).toBe('pull.upToDate');
  });

  it('fetches then fast-forwards', () => {
    const team = teamWithRemoteWork();
    const before = team.alice.headCommit.hash;
    const after = team.bob.headCommit.hash;
    const result = pull(team, team.alice);

    expect(result.output).toBe(
      [
        FROM,
        `   ${shortHash(before)}..${shortHash(after)}  main       -> origin/main`,
        `Updating ${shortHash(before)}..${shortHash(after)}`,
        'Fast-forward',
        ' CONTRIBUTING.md | 1 +',
        ' 1 file changed, 1 insertion(+)',
        ' create mode 100644 CONTRIBUTING.md',
      ].join('\n'),
    );
    expect(result.explanation.key).toBe('pull.fastForward');
    expect(team.alice.headCommit.hash).toBe(after);
    expect(team.alice.workspace.files['CONTRIBUTING.md']).toBe('Be kind\n');
  });

  it('asks how to reconcile divergent branches, keeping what was fetched', () => {
    const team = teamWithRemoteWork();
    team.alice.commit('feat: add license', { LICENSE: 'MIT\n' });
    const local = team.alice.headCommit.hash;
    const result = pull(team, team.alice);

    expect(result.exitCode).toBe(128);
    expect(result.output).toMatch(/^From .*\n.*-> origin\/main\nhint: You have divergent branches/);
    expect(result.output).toMatch(/fatal: Need to specify how to reconcile divergent branches\.$/);
    expect(result.explanation.key).toBe('pull.divergent');
    expect(team.alice.headCommit.hash).toBe(local);
    expect(team.alice.repository.remoteBranches['origin/main']).toBe(team.bob.headCommit.hash);
  });

  it('merges with --no-rebase', () => {
    const team = teamWithRemoteWork();
    team.alice.commit('feat: add license', { LICENSE: 'MIT\n' });
    const result = pull(team, team.alice, { mode: 'merge' });

    expect(result.output).toContain("Merge made by the 'ort' strategy.");
    expect(result.explanation.key).toBe('pull.merged');
    expect(team.alice.headCommit.parents).toHaveLength(2);
    expect(commitSubject(team.alice.headCommit.message)).toBe(
      "Merge branch 'main' of https://github.com/alice/project",
    );
  });

  it('replays local commits on top of the remote ones with --rebase', () => {
    const team = teamWithRemoteWork();
    team.alice.commit('feat: add license', { LICENSE: 'MIT\n' });
    const result = pull(team, team.alice, { mode: 'rebase' });

    expect(result.output).toMatch(/Successfully rebased and updated refs\/heads\/main\.$/);
    expect(result.explanation.key).toBe('pull.rebased');
    expect(team.alice.headCommit.parents).toEqual([team.bob.headCommit.hash]);
    expect(Object.keys(team.alice.workspace.files).sort()).toEqual([
      'CONTRIBUTING.md',
      'LICENSE',
      'README.md',
    ]);
  });

  it('stops on conflicts like a merge does', () => {
    const team = new TeamBench().share();
    team.bob.commit('docs: greet the world', { 'README.md': 'Hello world\n' });
    team.online(team.bob, new PushCommand(), {});
    team.alice.commit('docs: greet everyone', { 'README.md': 'Hello everyone\n' });

    const result = pull(team, team.alice, { mode: 'merge' });

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('CONFLICT (content): Merge conflict in README.md');
    expect(result.explanation.key).toBe('pull.mergeConflicts');
    expect(team.alice.repository.operation?.type).toBe('merge');
  });

  it('keeps the fetch when a fast-forward only pull is impossible', () => {
    const team = teamWithRemoteWork();
    team.alice.commit('feat: add license', { LICENSE: 'MIT\n' });
    const result = pull(team, team.alice, { fastForwardOnly: true });

    expect(result.output).toMatch(/fatal: Not possible to fast-forward, aborting\.$/);
    expect(result.explanation.key).toBe('error.notPossibleToFastForward');
    expect(team.alice.repository.remoteBranches['origin/main']).toBe(team.bob.headCommit.hash);
  });

  it('needs to know which branch to pull', () => {
    const team = new TeamBench().share();
    team.alice.run(new CheckoutCommand(team.context), { targets: [], newBranch: 'feature' });
    const result = pull(team, team.alice);

    expect(result.output).toMatch(/^There is no tracking information for the current branch\./);
    expect(result.output).toContain('git branch --set-upstream-to=origin/<branch> feature');
    expect(pull(team, team.alice, { remote: 'origin' }).output).toMatch(
      /^You asked to pull from the remote 'origin', but did not specify/,
    );

    team.alice.run(new CheckoutCommand(team.context), { targets: ['HEAD'], detach: true });
    expect(pull(team, team.alice).output).toMatch(/^You are not currently on a branch\./);
  });

  it('pulls an explicit remote branch', () => {
    const team = teamWithRemoteWork();
    team.alice.run(new CheckoutCommand(team.context), { targets: [], newBranch: 'feature' });
    const result = pull(team, team.alice, { remote: 'origin', branch: 'main' });

    expect(result.explanation.key).toBe('pull.fastForward');
    expect(team.alice.headCommit.hash).toBe(team.bob.headCommit.hash);
  });

  it('starts an unborn branch where the remote branch is', () => {
    const team = new TeamBench().share();
    const carol = new GitTestBench(team.context).init();
    carol.run(new RemoteCommand(), { action: 'add', name: 'origin', url: ORIGIN_URL });
    const result = pull(team, carol, { remote: 'origin', branch: 'main' });

    expect(result.explanation.key).toBe('pull.started');
    expect(carol.headCommit.hash).toBe(team.alice.headCommit.hash);
    expect(carol.workspace.files).toEqual({ 'README.md': 'Hello\n' });
  });

  it('reports an upstream branch that was deleted on the remote', () => {
    const team = new TeamBench().share();
    team.online(team.alice, new PushCommand(), {
      remote: 'origin',
      refspecs: ['main'],
      delete: true,
    });
    expect(pull(team, team.bob).output).toBe(
      [
        "Your configuration specifies to merge with the ref 'refs/heads/main'",
        'from the remote, but no such ref was fetched.',
      ].join('\n'),
    );
  });
});
