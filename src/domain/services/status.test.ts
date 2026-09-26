import { blobHashFor, buildRepository, fakeHash } from '@/test/fixtures/repositoryFixtures';

import { computeStatus, isWorkingTreeClean } from './status';

describe('computeStatus', () => {
  const base = buildRepository(
    [
      {
        hash: fakeHash('a'),
        files: { 'keep.txt': 'same\n', 'edit.txt': 'v1\n', 'gone.txt': 'x\n' },
      },
    ],
    { main: fakeHash('a') },
  );

  it('is clean when index and working tree match HEAD', () => {
    const status = computeStatus(base, {
      'keep.txt': 'same\n',
      'edit.txt': 'v1\n',
      'gone.txt': 'x\n',
    });
    expect(isWorkingTreeClean(status)).toBe(true);
    expect(status.untracked).toEqual([]);
  });

  it('separates staged, unstaged and untracked changes', () => {
    const staged = blobHashFor('staged\n');
    const repository = {
      ...base,
      blobs: { ...base.blobs, [staged]: 'staged\n' },
      index: { ...base.index, 'new.txt': staged },
    };
    const status = computeStatus(repository, {
      'keep.txt': 'same\n',
      'edit.txt': 'v2\n',
      'new.txt': 'staged\n',
      'notes/todo.md': 'todo\n',
    });

    expect(status.staged).toEqual([{ path: 'new.txt', type: 'added' }]);
    expect(status.unstaged).toEqual([
      { path: 'edit.txt', type: 'modified' },
      { path: 'gone.txt', type: 'deleted' },
    ]);
    expect(status.untracked).toEqual(['notes/todo.md']);
  });
});
