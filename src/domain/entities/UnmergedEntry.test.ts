import { fakeHash } from '@/test/fixtures/repositoryFixtures';

import { classifyUnmerged } from './UnmergedEntry';

const [base, ours, theirs] = [fakeHash('1'), fakeHash('2'), fakeHash('3')];

describe('classifyUnmerged', () => {
  it.each([
    [{ base, ours, theirs }, 'both modified'],
    [{ base: null, ours, theirs }, 'both added'],
    [{ base, ours: null, theirs }, 'deleted by us'],
    [{ base, ours, theirs: null }, 'deleted by them'],
    [{ base: null, ours, theirs: null }, 'added by us'],
    [{ base: null, ours: null, theirs }, 'added by them'],
  ])('describes %o as %s', (entry, expected) => {
    expect(classifyUnmerged(entry)).toBe(expected);
  });
});
