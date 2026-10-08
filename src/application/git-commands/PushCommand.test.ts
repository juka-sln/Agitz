import {
  DEFAULT_BRANCH_PROTECTION,
  type BranchProtection,
} from '@/domain/entities/BranchProtection';
import { setBranchProtection } from '@/domain/entities/Network';
import { getHeadCommitHash } from '@/domain/entities/Repository';
import { shortHash } from '@/domain/value-objects/Hash';
import { GitTestBench } from '@/test/fixtures/GitTestBench';
import { ORIGIN_URL, TeamBench } from '@/test/fixtures/TeamBench';

import { CheckoutCommand } from './CheckoutCommand';
import { CommitCommand } from './CommitCommand';
import { FetchCommand } from './FetchCommand';
import { PushCommand } from './PushCommand';
import { RemoteCommand } from './RemoteCommand';
import { TagCommand } from './TagCommand';

const TO = `To ${ORIGIN_URL}`;
const FAILED = `error: failed to push some refs to '${ORIGIN_URL}'`;

describe('PushCommand', () => {
  const push = new PushCommand();

  function aliceWithOrigin(team: TeamBench) {
    team.alice.init();
    team.alice.commit('feat: initial commit', { 'README.md': 'Hello\n' });
    team.alice.run(new RemoteCommand(), { action: 'add', name: 'origin', url: ORIGIN_URL });
    return team.alice;
  }

  it('publishes a new branch and sets its upstream with -u', () => {
    const team = new TeamBench();
    const alice = aliceWithOrigin(team);
    const result = team.online(alice, push, {
      remote: 'origin',
      refspecs: ['main'],
      setUpstream: true,
    });

    expect(result.output).toBe(
      [
        TO,
        ' * [new branch]      main -> main',
        "branch 'main' set up to track 'origin/main'.",
      ].join('\n'),
    );
    expect(result.explanation).toEqual({
      key: 'push.created',
      params: { remote: 'origin', branch: 'main', upstream: 'origin/main', count: 1 },
    });
    expect(team.hosted.branches.main).toBe(alice.headCommit.hash);
    expect(team.hosted.commits[alice.headCommit.hash]).toEqual(alice.headCommit);
    expect(team.hosted.blobs).toEqual(alice.repository.blobs);
    expect(alice.repository.remoteBranches).toEqual({ 'origin/main': alice.headCommit.hash });
    expect(alice.repository.upstreams).toEqual({ main: { remote: 'origin', branch: 'main' } });
  });

  it('makes the first pushed branch the default branch of an empty repository', () => {
    const team = new TeamBench();
    const alice = aliceWithOrigin(team);
    alice.run(new CheckoutCommand(team.context), { targets: [], newBranch: 'develop' });
    team.online(alice, push, { remote: 'origin', refspecs: ['develop'] });

    expect(team.hosted.head).toEqual({ type: 'attached', branch: 'develop' });
  });

  it('needs a destination and an upstream', () => {
    const team = new TeamBench();
    const bench = new GitTestBench(team.context).init();
    bench.commit('feat: start');
    expect(team.online(bench, push, {}).output).toMatch(/^fatal: No configured push destination\./);

    const alice = aliceWithOrigin(team);
    const result = team.online(alice, push, {});
    expect(result.output).toMatch(/^fatal: The current branch main has no upstream branch\./);
    expect(result.output).toContain('    git push --set-upstream origin main');
    expect(result.exitCode).toBe(128);
  });

  it('refuses to guess the branch from a detached HEAD', () => {
    const team = new TeamBench();
    const alice = aliceWithOrigin(team);
    alice.run(new CheckoutCommand(team.context), { targets: ['HEAD'], detach: true });

    expect(team.online(alice, push, { remote: 'origin' }).output).toMatch(
      /^fatal: You are not currently on a branch\./,
    );
  });

  it('fast-forwards the remote branch, then reports that everything is up to date', () => {
    const team = new TeamBench().share();
    const before = team.bob.headCommit.hash;
    team.bob.commit('docs: add usage', { 'README.md': 'Hello\nUsage\n' });

    const result = team.online(team.bob, push, {});
    expect(result.output).toBe(
      [TO, `   ${shortHash(before)}..${shortHash(team.bob.headCommit.hash)}  main -> main`].join(
        '\n',
      ),
    );
    expect(result.explanation.key).toBe('push.updated');

    const again = team.online(team.bob, push, {});
    expect(again.output).toBe('Everything up-to-date');
    expect(again.explanation.key).toBe('push.upToDate');
  });

  it('rejects a push when the remote has commits we never fetched', () => {
    const team = new TeamBench().share();
    team.bob.commit('feat: bob', { 'bob.txt': 'bob\n' });
    team.online(team.bob, push, {});
    team.alice.commit('feat: alice', { 'alice.txt': 'alice\n' });
    const remoteTip = team.hosted.branches.main;

    const result = team.online(team.alice, push, {});

    expect(result.output).toBe(
      [
        TO,
        ' ! [rejected]        main -> main (fetch first)',
        FAILED,
        'hint: Updates were rejected because the remote contains work that you do not',
        'hint: have locally. This is usually caused by another repository pushing to',
        'hint: the same ref. If you want to integrate the remote changes, use',
        "hint: 'git pull' before pushing again.",
        "hint: See the 'Note about fast-forwards' in 'git push --help' for details.",
      ].join('\n'),
    );
    expect(result.exitCode).toBe(1);
    expect(result.explanation).toEqual({
      key: 'push.rejectedFetchFirst',
      params: { remote: 'origin', branch: 'main' },
    });
    expect(team.hosted.branches.main).toBe(remoteTip);
  });

  it('rejects a non-fast-forward push once the remote commits are known', () => {
    const team = new TeamBench().share();
    team.bob.commit('feat: bob', { 'bob.txt': 'bob\n' });
    team.online(team.bob, push, {});
    team.alice.commit('feat: alice', { 'alice.txt': 'alice\n' });
    team.online(team.alice, new FetchCommand(), {});

    const result = team.online(team.alice, push, {});
    expect(result.output.split('\n').slice(0, 2)).toEqual([
      TO,
      ' ! [rejected]        main -> main (non-fast-forward)',
    ]);
    expect(result.output).toContain(
      'hint: Updates were rejected because the tip of your current branch is behind',
    );
  });

  it('overwrites the remote branch with --force', () => {
    const team = new TeamBench().share();
    team.bob.commit('feat: bob', { 'bob.txt': 'bob\n' });
    team.online(team.bob, push, {});
    const lost = team.bob.headCommit.hash;
    team.alice.commit('feat: alice', { 'alice.txt': 'alice\n' });

    const result = team.online(team.alice, push, { force: true });

    expect(result.output).toBe(
      [
        TO,
        ` + ${shortHash(lost)}...${shortHash(team.alice.headCommit.hash)} main -> main (forced update)`,
      ].join('\n'),
    );
    expect(result.explanation.key).toBe('push.forced');
    expect(team.hosted.branches.main).toBe(team.alice.headCommit.hash);
  });

  it('only forces with a lease when the remote did not move since the last fetch', () => {
    const team = new TeamBench().share();
    team.bob.commit('feat: bob', { 'bob.txt': 'bob\n' });
    team.online(team.bob, push, {});
    team.alice.run(new CommitCommand(team.context), { messages: ['feat: reworded'], amend: true });

    const stale = team.online(team.alice, push, { forceWithLease: true });
    expect(stale.output).toBe(
      [TO, ' ! [rejected]        main -> main (stale info)', FAILED].join('\n'),
    );
    expect(stale.explanation.key).toBe('push.rejectedStale');

    team.online(team.alice, new FetchCommand(), {});
    const leased = team.online(team.alice, push, { forceWithLease: true });
    expect(leased.exitCode).toBe(0);
    expect(team.hosted.branches.main).toBe(team.alice.headCommit.hash);
  });

  it('deletes remote branches', () => {
    const team = new TeamBench().share();
    team.online(team.alice, push, { remote: 'origin', refspecs: ['main:feature'] });
    expect(team.hosted.branches.feature).toBe(team.alice.headCommit.hash);

    const result = team.online(team.alice, push, {
      remote: 'origin',
      refspecs: ['feature'],
      delete: true,
    });
    expect(result.output).toBe([TO, ' - [deleted]         feature'].join('\n'));
    expect(result.explanation.key).toBe('push.deleted');
    expect(team.hosted.branches.feature).toBeUndefined();
    expect(team.alice.repository.remoteBranches['origin/feature']).toBeUndefined();

    const missing = team.online(team.alice, push, { remote: 'origin', refspecs: [':nope'] });
    expect(missing.output).toBe(
      ["error: unable to delete 'nope': remote ref does not exist", FAILED].join('\n'),
    );
  });

  it('pushes tags', () => {
    const team = new TeamBench().share();
    team.alice.run(new TagCommand(team.context), { action: 'create', name: 'v1.0.0' });

    const result = team.online(team.alice, push, { tags: true });
    expect(result.output).toBe([TO, ' * [new tag]         v1.0.0 -> v1.0.0'].join('\n'));
    expect(result.explanation.key).toBe('push.tags');
    expect(team.hosted.tags['v1.0.0']?.target).toBe(team.alice.headCommit.hash);
  });

  it('pushes HEAD or any commit to a named branch', () => {
    const team = new TeamBench().share();
    expect(team.online(team.alice, push, { remote: 'origin', refspecs: ['HEAD'] }).output).toBe(
      'Everything up-to-date',
    );
    const result = team.online(team.alice, push, { remote: 'origin', refspecs: ['HEAD:release'] });
    expect(result.output).toBe([TO, ' * [new branch]      HEAD -> release'].join('\n'));
    expect(getHeadCommitHash(team.alice.repository)).toBe(team.hosted.branches.release);
  });

  it('reports refspecs matching nothing', () => {
    const team = new TeamBench().share();
    const result = team.online(team.alice, push, { remote: 'origin', refspecs: ['nope'] });

    expect(result.output).toBe(['error: src refspec nope does not match any', FAILED].join('\n'));
    expect(result.exitCode).toBe(1);
  });

  describe('to a protected branch', () => {
    function protectedTeam(protection: BranchProtection = DEFAULT_BRANCH_PROTECTION) {
      const team = new TeamBench().share();
      team.network = setBranchProtection(team.network, ORIGIN_URL, 'main', protection);
      return team;
    }

    const declined = (branch: string, error: string) => [
      `remote: error: GH006: Protected branch update failed for refs/heads/${branch}.`,
      `remote: error: ${error}`,
      TO,
      ` ! [remote rejected] ${branch} -> ${branch} (protected branch hook declined)`,
      FAILED,
    ];

    it('requires a pull request instead of a direct push', () => {
      const team = protectedTeam();
      const before = team.hosted.branches.main;
      team.alice.commit('feat: add greeting', { 'hello.txt': 'Hi\n' });

      const result = team.online(team.alice, push, {});
      expect(result.output).toBe(
        declined('main', 'Changes must be made through a pull request.').join('\n'),
      );
      expect(result.exitCode).toBe(1);
      expect(result.explanation).toEqual({
        key: 'push.protectedPullRequest',
        params: { remote: 'origin', branch: 'main' },
      });
      expect(team.hosted.branches.main).toBe(before);
      expect(team.alice.repository.remoteBranches['origin/main']).toBe(before);
    });

    it('still accepts pushes to other branches', () => {
      const team = protectedTeam();
      team.alice.run(new CheckoutCommand(team.context), { targets: [], newBranch: 'feature' });
      team.alice.commit('feat: add greeting', { 'hello.txt': 'Hi\n' });

      const result = team.online(team.alice, push, { remote: 'origin', refspecs: ['feature'] });
      expect(result.exitCode).toBe(0);
      expect(team.hosted.branches.feature).toBe(team.alice.headCommit.hash);
    });

    it('refuses forced pushes and deletions even when direct pushes are allowed', () => {
      const team = protectedTeam({ ...DEFAULT_BRANCH_PROTECTION, requirePullRequest: false });
      team.alice.run(new CommitCommand(team.context), {
        messages: ['feat: reworded'],
        amend: true,
      });

      expect(team.online(team.alice, push, { force: true }).output).toBe(
        declined('main', 'Cannot force-push to this branch').join('\n'),
      );
      const deletion = team.online(team.alice, push, { remote: 'origin', refspecs: [':main'] });
      expect(deletion.output).toBe(
        [
          'remote: error: GH006: Protected branch update failed for refs/heads/main.',
          'remote: error: Cannot delete this branch',
          TO,
          ' ! [remote rejected] main (protected branch hook declined)',
          FAILED,
        ].join('\n'),
      );
      expect(deletion.explanation.key).toBe('push.protectedDelete');
    });

    it('lets fast-forward pushes through when only force pushes are blocked', () => {
      const team = protectedTeam({
        requirePullRequest: false,
        requiredApprovals: 0,
        requireStatusChecks: false,
      });
      team.alice.commit('feat: add greeting', { 'hello.txt': 'Hi\n' });

      expect(team.online(team.alice, push, {}).exitCode).toBe(0);
      expect(team.hosted.branches.main).toBe(team.alice.headCommit.hash);
    });

    it('waits for a passing status check when one is required', () => {
      const team = protectedTeam({
        requirePullRequest: false,
        requiredApprovals: 0,
        requireStatusChecks: true,
      });
      team.alice.commit('feat: add greeting', { 'hello.txt': 'Hi\n' });

      expect(team.online(team.alice, push, {}).output).toContain(
        'remote: error: Required status check "ci" is expected.',
      );
    });
  });
});
