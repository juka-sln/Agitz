import { buildRepository, fakeHash } from '@/test/fixtures/repositoryFixtures';

import { collectReachableCommits, isAncestor, listCommitsInLogOrder } from './history';

const A = fakeHash('a');
const B = fakeHash('b');
const C = fakeHash('c');
const D = fakeHash('d');
const M = fakeHash('e');

// A <- B <- C (main)
//       \
//        D (feature), then M merges C and D
const repository = buildRepository(
  [
    { hash: A, time: 1 },
    { hash: B, parents: [A], time: 2 },
    { hash: C, parents: [B], time: 3 },
    { hash: D, parents: [B], time: 4 },
    { hash: M, parents: [C, D], time: 5 },
  ],
  { main: M, feature: D },
);

describe('history', () => {
  it('collects every reachable commit', () => {
    expect(collectReachableCommits(repository, [D])).toEqual(new Set([D, B, A]));
  });

  it('knows ancestry', () => {
    expect(isAncestor(repository, A, M)).toBe(true);
    expect(isAncestor(repository, C, D)).toBe(false);
  });

  it('lists commits newest first without showing a parent before its children', () => {
    expect(listCommitsInLogOrder(repository, [M]).map((commit) => commit.hash)).toEqual([
      M,
      D,
      C,
      B,
      A,
    ]);
  });

  it('keeps topological order when dates are equal or skewed', () => {
    const skewed = buildRepository(
      [
        { hash: A, time: 10 },
        { hash: B, parents: [A], time: 5 },
        { hash: C, parents: [B], time: 5 },
      ],
      { main: C },
    );
    expect(listCommitsInLogOrder(skewed, [C]).map((commit) => commit.hash)).toEqual([C, B, A]);
  });
});
