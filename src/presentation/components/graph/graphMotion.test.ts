import { AddCommand } from '@/application/git-commands/AddCommand';
import { CheckoutCommand } from '@/application/git-commands/CheckoutCommand';
import { CommitCommand } from '@/application/git-commands/CommitCommand';
import { RebaseCommand } from '@/application/git-commands/RebaseCommand';
import { getCommitGraph } from '@/application/queries/getCommitGraph';
import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { describeGraphMotion, REPLAY_STAGGER_MS } from './graphMotion';
import { COLUMN_WIDTH, layoutCommitGraph } from './layoutCommitGraph';

function nodesOf(bench: GitTestBench) {
  return layoutCommitGraph(getCommitGraph(bench.repository)).nodes;
}

function subjectOf(bench: GitTestBench, hash: string) {
  return nodesOf(bench).find((node) => node.id === hash)?.data.commit.subject;
}

describe('describeGraphMotion', () => {
  it('slides the branch label and HEAD from the previous tip on a new commit', () => {
    const bench = new GitTestBench().init();
    bench.commit('feat: a', { 'a.txt': 'a' });
    const before = nodesOf(bench);
    bench.commit('feat: b', { 'b.txt': 'b' });

    const motion = describeGraphMotion(before, nodesOf(bench));

    expect([...motion.keys()].map((hash) => subjectOf(bench, hash))).toEqual(['feat: b']);
    expect([...motion.values()][0]).toEqual({
      replayedFrom: null,
      delayMs: 0,
      labelsFrom: { 'branch:main': { x: -COLUMN_WIDTH, y: 0 }, HEAD: { x: -COLUMN_WIDTH, y: 0 } },
    });
  });

  it('flies rebased commits from their originals, one after the other', () => {
    const bench = new GitTestBench().init();
    const checkout = new CheckoutCommand(bench.context);
    bench.commit('feat: base', { 'a.txt': 'a' });
    bench.run(checkout, { targets: [], newBranch: 'feature' });
    bench.commit('feat: one', { 'one.txt': '1' });
    bench.commit('feat: two', { 'two.txt': '2' });
    bench.run(checkout, { targets: ['main'] });
    bench.commit('feat: main', { 'main.txt': 'm' });
    bench.run(checkout, { targets: ['feature'] });
    const before = nodesOf(bench);
    bench.run(new RebaseCommand(bench.context), { action: 'start', upstream: 'main' });
    const after = nodesOf(bench);

    const motion = describeGraphMotion(before, after);
    const replays = after.flatMap((node) => {
      const move = motion.get(node.id);
      return move?.replayedFrom ? [[node.data.commit.subject, move.delayMs]] : [];
    });
    expect(replays).toEqual([
      ['feat: one', 0],
      ['feat: two', REPLAY_STAGGER_MS],
    ]);

    const two = after.find(
      (node) => node.data.commit.subject === 'feat: two' && node.data.commit.isReachable,
    );
    const original = before.find((node) => node.data.commit.subject === 'feat: two');
    expect(two && motion.get(two.id)).toMatchObject({
      replayedFrom: {
        x: (original?.position.x ?? 0) - (two?.position.x ?? 0),
        y: (original?.position.y ?? 0) - (two?.position.y ?? 0),
      },
      // The label rides along with its station, so it has nowhere else to come from.
      labelsFrom: {},
    });
  });

  it('treats an amended commit as a replay of the one it replaces', () => {
    const bench = new GitTestBench().init();
    bench.commit('feat: a', { 'a.txt': 'a' });
    const before = nodesOf(bench);
    bench.write({ 'a.txt': 'better' });
    bench.run(new AddCommand(bench.context), { pathspecs: ['a.txt'] });
    bench.run(new CommitCommand(bench.context), { messages: ['feat: a'], amend: true });

    const motion = describeGraphMotion(before, nodesOf(bench));
    expect([...motion.values()].map((move) => move.replayedFrom)).toEqual([
      { x: -COLUMN_WIDTH, y: 0 },
    ]);
  });

  it('stays still when nothing moved', () => {
    const bench = new GitTestBench().init();
    bench.commit('feat: a', { 'a.txt': 'a' });

    expect(describeGraphMotion(nodesOf(bench), nodesOf(bench)).size).toBe(0);
  });
});
