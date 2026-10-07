import { BranchCommand } from '@/application/git-commands/BranchCommand';
import { CheckoutCommand } from '@/application/git-commands/CheckoutCommand';
import { FetchCommand } from '@/application/git-commands/FetchCommand';
import { PushCommand } from '@/application/git-commands/PushCommand';
import { TagCommand } from '@/application/git-commands/TagCommand';
import { GitTestBench } from '@/test/fixtures/GitTestBench';
import { TeamBench } from '@/test/fixtures/TeamBench';

import { DETACHED_LANE, getCommitGraph } from './getCommitGraph';

/** main: A - B - D(merge-less), feature: A - B - C */
function setup() {
  const bench = new GitTestBench().init();
  const checkout = new CheckoutCommand(bench.context);
  bench.commit('feat: a', { 'a.txt': 'a' });
  bench.commit('feat: b', { 'b.txt': 'b' });
  bench.run(checkout, { targets: [], newBranch: 'feature' });
  bench.commit('feat: c', { 'c.txt': 'c' });
  bench.run(checkout, { targets: ['main'] });
  bench.commit('feat: d', { 'd.txt': 'd' });
  return { bench, checkout };
}

describe('getCommitGraph', () => {
  it('orders commits chronologically and assigns lanes by first parent', () => {
    const { bench } = setup();
    const graph = getCommitGraph(bench.repository);

    expect(graph.commits.map((commit) => [commit.subject, commit.column, commit.lane])).toEqual([
      ['feat: a', 0, 'main'],
      ['feat: b', 1, 'main'],
      ['feat: c', 2, 'feature'],
      ['feat: d', 3, 'main'],
    ]);
    expect(graph.lanes).toEqual(['main', 'feature']);
  });

  it('marks branch tips and HEAD', () => {
    const { bench } = setup();
    const graph = getCommitGraph(bench.repository);
    const byLabel = (subject: string) => graph.commits.find((commit) => commit.subject === subject);

    expect(byLabel('feat: d')).toMatchObject({ branches: ['main'], isHead: true });
    expect(byLabel('feat: c')).toMatchObject({ branches: ['feature'], isHead: false });
    expect(graph.head).toEqual({ type: 'attached', branch: 'main' });
  });

  it('shows commits made on a detached HEAD, then marks them unreachable once left', () => {
    const { bench, checkout } = setup();
    bench.run(checkout, { targets: ['HEAD'], detach: true });
    bench.commit('test: experiment', { 'lab.txt': 'lab' });

    const detached = getCommitGraph(bench.repository);
    expect(detached.commits.at(-1)).toMatchObject({ lane: DETACHED_LANE, isHead: true });
    expect(detached.lanes).toEqual(['main', 'feature', DETACHED_LANE]);

    bench.run(checkout, { targets: ['main'] });
    const left = getCommitGraph(bench.repository);
    expect(left.commits.at(-1)).toMatchObject({ lane: null, isReachable: false });
  });

  it('keeps commits of a deleted branch without a lane', () => {
    const { bench } = setup();
    bench.run(new BranchCommand(), { action: 'delete', names: ['feature'], force: true });
    const graph = getCommitGraph(bench.repository);

    expect(graph.commits.find((commit) => commit.subject === 'feat: c')).toMatchObject({
      lane: null,
      isReachable: false,
    });
    expect(graph.lanes).toEqual(['main']);
  });

  it('lists tags and keeps tagged commits reachable', () => {
    const { bench } = setup();
    bench.run(new TagCommand(bench.context), {
      action: 'create',
      name: 'v0.1.0',
      target: 'feature',
    });
    bench.run(new BranchCommand(), { action: 'delete', names: ['feature'], force: true });
    const graph = getCommitGraph(bench.repository);

    expect(graph.commits.find((commit) => commit.subject === 'feat: c')).toMatchObject({
      tags: ['v0.1.0'],
      isReachable: true,
    });
  });

  it('shows remote-tracking branches and the commits only they know', () => {
    const team = new TeamBench().share();
    team.bob.commit('feat: from bob', { 'bob.txt': 'bob' });
    team.online(team.bob, new PushCommand(), {});
    team.alice.commit('feat: from alice', { 'alice.txt': 'alice' });
    team.online(team.alice, new FetchCommand(), {});
    const graph = getCommitGraph(team.alice.repository);

    expect(
      graph.commits.map((commit) => [commit.subject, commit.lane, commit.remoteBranches]),
    ).toEqual([
      ['feat: initial commit', 'main', []],
      ['feat: from bob', 'origin/main', ['origin/main']],
      ['feat: from alice', 'main', []],
    ]);
    expect(graph.lanes).toEqual(['main', 'origin/main']);
    expect(graph.commits.every((commit) => commit.isReachable)).toBe(true);
  });
});
