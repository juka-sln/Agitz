import { CheckoutCommand } from '@/application/git-commands/CheckoutCommand';
import { getCommitGraph } from '@/application/queries/getCommitGraph';
import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { COLUMN_WIDTH, layoutCommitGraph, ROW_HEIGHT, transitPath } from './layoutCommitGraph';

function forkedGraph() {
  const bench = new GitTestBench().init();
  const checkout = new CheckoutCommand(bench.context);
  bench.commit('feat: a', { 'a.txt': 'a' });
  bench.run(checkout, { targets: [], newBranch: 'feature' });
  bench.commit('feat: b', { 'b.txt': 'b' });
  return getCommitGraph(bench.repository);
}

describe('layoutCommitGraph', () => {
  it('places commits by column and branch row', () => {
    const { nodes } = layoutCommitGraph(forkedGraph());

    expect(nodes.map((node) => [node.data.commit.subject, node.position])).toEqual([
      ['feat: a', { x: 0, y: 0 }],
      ['feat: b', { x: COLUMN_WIDTH, y: ROW_HEIGHT }],
    ]);
  });

  it('colors each lane and marks HEAD on the current commit', () => {
    const { nodes, edges } = layoutCommitGraph(forkedGraph());

    expect(nodes.map((node) => [node.data.lineToken, node.data.headState])).toEqual([
      ['line-0', null],
      ['line-1', 'attached'],
    ]);
    expect(nodes[1]?.data.branchTokens).toEqual({ feature: 'line-1' });
    expect(edges).toHaveLength(1);
    expect(edges[0]?.data).toEqual({
      lineToken: 'line-1',
      bend: 'source',
      offset: 0,
      faded: false,
    });
  });
});

describe('transitPath', () => {
  it('draws a straight line on the same row', () => {
    expect(transitPath(0, 10, 100, 10, 'source')).toBe('M 0 10 L 100 10');
  });

  it('drops vertically between columns, right after a fork', () => {
    expect(transitPath(0, 0, 300, 140, 'source')).toBe(
      'M 0 0 L 50 0 L 74 24 L 74 116 L 98 140 L 300 140',
    );
  });

  it('drops vertically right before a merge', () => {
    expect(transitPath(0, 140, 300, 0, 'target')).toBe(
      'M 0 140 L 202 140 L 226 116 L 226 24 L 250 0 L 300 0',
    );
  });
});

describe('parallel forks', () => {
  it('offsets each additional line forking from the same station', () => {
    const bench = new GitTestBench().init();
    const checkout = new CheckoutCommand(bench.context);
    bench.commit('feat: a', { 'a.txt': 'a' });
    bench.run(checkout, { targets: [], newBranch: 'one' });
    bench.commit('feat: one', { 'b.txt': 'b' });
    bench.run(checkout, { targets: ['main'] });
    bench.run(checkout, { targets: [], newBranch: 'two' });
    bench.commit('feat: two', { 'c.txt': 'c' });

    const { edges } = layoutCommitGraph(getCommitGraph(bench.repository));
    expect(edges.map((edge) => edge.data?.offset)).toEqual([0, 10]);
  });
});
