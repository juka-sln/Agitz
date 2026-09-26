import { computeStatus } from '@/domain/services/status';
import { blobHashFor, buildRepository, fakeHash } from '@/test/fixtures/repositoryFixtures';

import {
  collapseUntrackedPaths,
  formatLocalChanges,
  formatLongStatus,
  formatShortStatus,
} from './formatStatus';

const committed = buildRepository(
  [{ hash: fakeHash('a'), files: { 'app.ts': 'v1\n', 'src/lib.ts': 'lib\n' } }],
  {
    main: fakeHash('a'),
  },
);
const cleanFiles = { 'app.ts': 'v1\n', 'src/lib.ts': 'lib\n' };

describe('formatLongStatus', () => {
  it('describes an empty repository', () => {
    const empty = buildRepository([], {});
    expect(formatLongStatus(empty, computeStatus(empty, {}))).toBe(
      [
        'On branch main',
        '',
        'No commits yet',
        '',
        'nothing to commit (create/copy files and use "git add" to track)',
      ].join('\n'),
    );
  });

  it('describes a clean working tree', () => {
    expect(formatLongStatus(committed, computeStatus(committed, cleanFiles))).toBe(
      'On branch main\nnothing to commit, working tree clean',
    );
  });

  it('lists every kind of change with Git hints', () => {
    const staged = blobHashFor('new\n');
    const repository = {
      ...committed,
      blobs: { ...committed.blobs, [staged]: 'new\n' },
      index: { ...committed.index, 'new.ts': staged },
    };
    const files = { 'app.ts': 'v2\n', 'new.ts': 'new\n', 'docs/a.md': 'a\n', 'docs/b.md': 'b\n' };

    expect(formatLongStatus(repository, computeStatus(repository, files))).toBe(
      [
        'On branch main',
        'Changes to be committed:',
        '  (use "git restore --staged <file>..." to unstage)',
        '\tnew file:   new.ts',
        '',
        'Changes not staged for commit:',
        '  (use "git add/rm <file>..." to update what will be committed)',
        '  (use "git restore <file>..." to discard changes in working directory)',
        '\tmodified:   app.ts',
        '\tdeleted:    src/lib.ts',
        '',
        'Untracked files:',
        '  (use "git add <file>..." to include in what will be committed)',
        '\tdocs/',
      ].join('\n'),
    );
  });
});

describe('formatShortStatus', () => {
  it('prints two-letter codes and untracked entries last', () => {
    const files = { 'app.ts': 'v2\n', 'zz.txt': 'x\n' };
    expect(formatShortStatus(committed, computeStatus(committed, files))).toBe(
      [' M app.ts', ' D src/lib.ts', '?? zz.txt'].join('\n'),
    );
  });
});

describe('collapseUntrackedPaths', () => {
  it('keeps files inside tracked directories individual', () => {
    expect(
      collapseUntrackedPaths(committed, ['src/new.ts', 'src/deep/a.ts', 'other/x.ts']),
    ).toEqual(['other/', 'src/deep/', 'src/new.ts']);
  });
});

describe('formatLocalChanges', () => {
  it('summarizes staged and unstaged changes per path', () => {
    const files = { 'app.ts': 'v2\n' };
    expect(formatLocalChanges(computeStatus(committed, files))).toEqual([
      'M\tapp.ts',
      'D\tsrc/lib.ts',
    ]);
  });
});

describe('conflicts and pending operations', () => {
  const conflicted = {
    ...committed,
    index: { 'src/lib.ts': committed.index['src/lib.ts'] ?? fakeHash('0') },
    unmerged: { 'app.ts': { base: fakeHash('1'), ours: fakeHash('2'), theirs: fakeHash('3') } },
    operation: {
      type: 'merge' as const,
      theirs: fakeHash('3'),
      message: 'Merge',
      origHead: fakeHash('a'),
    },
  };
  const files = { 'app.ts': '<<<<<<< HEAD\n', 'src/lib.ts': 'lib\n' };

  it('explains how to finish or abort a merge', () => {
    expect(formatLongStatus(conflicted, computeStatus(conflicted, files))).toBe(
      [
        'On branch main',
        'You have unmerged paths.',
        '  (fix conflicts and run "git commit")',
        '  (use "git merge --abort" to abort the merge)',
        '',
        'Unmerged paths:',
        '  (use "git add <file>..." to mark resolution)',
        '\tboth modified:   app.ts',
        '',
        'no changes added to commit (use "git add" and/or "git commit -a")',
      ].join('\n'),
    );
  });

  it('prints unmerged codes in the short format', () => {
    expect(formatShortStatus(conflicted, computeStatus(conflicted, files))).toBe('UU app.ts');
  });

  it('says when all conflicts are fixed', () => {
    const resolved = { ...conflicted, unmerged: {}, index: committed.index };
    expect(formatLongStatus(resolved, computeStatus(resolved, cleanFiles))).toContain(
      'All conflicts fixed but you are still merging.',
    );
  });
});
