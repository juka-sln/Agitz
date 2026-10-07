import { shortHash } from '@/domain/value-objects/Hash';
import { TeamBench } from '@/test/fixtures/TeamBench';

import { BranchCommand } from './BranchCommand';
import { CheckoutCommand } from './CheckoutCommand';
import { FetchCommand } from './FetchCommand';
import { LogCommand } from './LogCommand';
import { MergeCommand } from './MergeCommand';
import { PushCommand } from './PushCommand';
import { StatusCommand } from './StatusCommand';

/** How the other commands present remote-tracking branches and upstreams. */
describe('remote tracking', () => {
  const status = new StatusCommand();
  const branch = new BranchCommand();

  function statusHeader(team: TeamBench) {
    return team.alice.run(status, {}).output.split('\n\n')[0];
  }

  it('tells in git status how the branch compares with its upstream', () => {
    const team = new TeamBench().share();
    expect(statusHeader(team)).toBe(
      "On branch main\nYour branch is up to date with 'origin/main'.",
    );

    team.alice.commit('feat: one', { 'one.txt': '1\n' });
    expect(statusHeader(team)).toBe(
      [
        'On branch main',
        "Your branch is ahead of 'origin/main' by 1 commit.",
        '  (use "git push" to publish your local commits)',
      ].join('\n'),
    );

    team.bob.commit('feat: two', { 'two.txt': '2\n' });
    team.bob.commit('feat: three', { 'three.txt': '3\n' });
    team.online(team.bob, new PushCommand(), {});
    team.online(team.alice, new FetchCommand(), {});
    expect(statusHeader(team)).toBe(
      [
        'On branch main',
        "Your branch and 'origin/main' have diverged,",
        'and have 1 and 2 different commits each, respectively.',
        '  (use "git pull" if you want to integrate the remote branch with yours)',
      ].join('\n'),
    );
  });

  it('tells when the branch is behind or its upstream is gone', () => {
    const team = new TeamBench().share();
    team.bob.commit('feat: two', { 'two.txt': '2\n' });
    team.online(team.bob, new PushCommand(), {});
    team.online(team.alice, new FetchCommand(), {});
    expect(statusHeader(team)).toBe(
      [
        'On branch main',
        "Your branch is behind 'origin/main' by 1 commit, and can be fast-forwarded.",
        '  (use "git pull" to update your local branch)',
      ].join('\n'),
    );

    team.online(team.bob, new PushCommand(), {
      remote: 'origin',
      refspecs: ['main'],
      delete: true,
    });
    team.online(team.alice, new FetchCommand(), { prune: true });
    expect(statusHeader(team)).toBe(
      [
        'On branch main',
        "Your branch is based on 'origin/main', but the upstream is gone.",
        '  (use "git branch --unset-upstream" to fixup)',
      ].join('\n'),
    );
  });

  it('creates a tracking branch when checking out a remote branch by its short name', () => {
    const team = new TeamBench().share();
    team.online(team.alice, new PushCommand(), { remote: 'origin', refspecs: ['main:feature'] });
    team.online(team.bob, new FetchCommand(), {});

    const result = team.bob.run(new CheckoutCommand(team.context), { targets: ['feature'] });

    expect(result.output).toBe(
      "branch 'feature' set up to track 'origin/feature'.\nSwitched to a new branch 'feature'",
    );
    expect(result.explanation.key).toBe('checkout.createdTrackingBranch');
    expect(team.bob.repository.upstreams.feature).toEqual({
      remote: 'origin',
      branch: 'feature',
    });

    const back = team.bob.run(new CheckoutCommand(team.context), { targets: ['main'] });
    expect(back.output).toBe(
      "Switched to branch 'main'\nYour branch is up to date with 'origin/main'.",
    );
  });

  it('detaches HEAD when checking out a remote-tracking branch itself', () => {
    const team = new TeamBench().share();
    const result = team.bob.run(new CheckoutCommand(team.context), { targets: ['origin/main'] });

    expect(result.explanation.key).toBe('checkout.detached');
  });

  it('lists remote-tracking branches and upstreams', () => {
    const team = new TeamBench().share();
    const hash = shortHash(team.alice.headCommit.hash);
    team.alice.commit('feat: one', { 'one.txt': '1\n' });
    const local = shortHash(team.alice.headCommit.hash);

    expect(team.alice.run(branch, { action: 'list', scope: 'remote' }).output).toBe(
      '  origin/main',
    );
    expect(team.alice.run(branch, { action: 'list', scope: 'all' }).output).toBe(
      '* main\n  remotes/origin/main',
    );
    expect(team.alice.run(branch, { action: 'list', verbosity: 1 }).output).toBe(
      `* main ${local} [ahead 1] feat: one`,
    );
    expect(team.alice.run(branch, { action: 'list', verbosity: 2, scope: 'all' }).output).toBe(
      [
        `* main                ${local} [origin/main: ahead 1] feat: one`,
        `  remotes/origin/main ${hash} feat: initial commit`,
      ].join('\n'),
    );
  });

  it('sets, moves and removes upstreams', () => {
    const team = new TeamBench().share();
    team.alice.run(branch, { action: 'unsetUpstream' });
    expect(team.alice.repository.upstreams).toEqual({});
    expect(team.alice.run(branch, { action: 'unsetUpstream' }).output).toBe(
      "fatal: branch 'main' has no upstream information",
    );

    const set = team.alice.run(branch, { action: 'setUpstream', upstream: 'origin/main' });
    expect(set.output).toBe("branch 'main' set up to track 'origin/main'.");
    expect(set.explanation.key).toBe('branch.upstreamSet');

    expect(
      team.alice.run(branch, { action: 'setUpstream', upstream: 'origin/nope' }).output,
    ).toMatch(/^fatal: the requested upstream branch 'origin\/nope' does not exist/);

    const created = team.alice.run(branch, {
      action: 'create',
      name: 'copy',
      startPoint: 'origin/main',
    });
    expect(created.output).toBe("branch 'copy' set up to track 'origin/main'.");
    team.alice.run(branch, { action: 'rename', oldName: 'copy', newName: 'renamed' });
    expect(team.alice.repository.upstreams.renamed).toEqual({ remote: 'origin', branch: 'main' });
    team.alice.run(branch, { action: 'delete', names: ['renamed'] });
    expect(team.alice.repository.upstreams.renamed).toBeUndefined();
  });

  it('decorates the log with remote-tracking branches', () => {
    const team = new TeamBench().share();
    expect(team.bob.run(new LogCommand(), { oneline: true }).output).toBe(
      `${shortHash(team.bob.headCommit.hash)} (HEAD -> main, origin/main) feat: initial commit`,
    );
  });

  it('names remote-tracking branches in merge messages', () => {
    const team = new TeamBench().share();
    team.bob.commit('feat: two', { 'two.txt': '2\n' });
    team.online(team.bob, new PushCommand(), {});
    team.alice.commit('feat: one', { 'one.txt': '1\n' });
    team.online(team.alice, new FetchCommand(), {});

    team.alice.run(new MergeCommand(team.context), { action: 'merge', target: 'origin/main' });
    expect(team.alice.headCommit.message).toBe("Merge remote-tracking branch 'origin/main'");
  });
});
