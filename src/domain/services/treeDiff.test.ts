import { fakeHash } from '@/test/fixtures/repositoryFixtures';

import { diffTrees } from './treeDiff';

describe('diffTrees', () => {
  it('reports added, modified and deleted paths sorted by path', () => {
    const before = { 'a.txt': fakeHash('1'), 'b.txt': fakeHash('2'), 'c.txt': fakeHash('3') };
    const after = { 'a.txt': fakeHash('1'), 'b.txt': fakeHash('4'), 'd.txt': fakeHash('5') };

    expect(diffTrees(before, after).map(({ path, type }) => [path, type])).toEqual([
      ['b.txt', 'modified'],
      ['c.txt', 'deleted'],
      ['d.txt', 'added'],
    ]);
  });
});
