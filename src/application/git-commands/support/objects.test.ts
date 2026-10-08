import { FakeObjectHasher } from '@/test/doubles/FakeObjectHasher';
import { buildRepository } from '@/test/fixtures/repositoryFixtures';

import { hashBlob, stageWorkingTreePath, storeBlob } from './objects';

const hasher = new FakeObjectHasher();

describe('git objects', () => {
  it('hashes blobs with the Git header so identical content shares one object', () => {
    const repository = buildRepository([], {});
    const first = storeBlob(hasher, repository, 'hello\n');
    const second = storeBlob(hasher, first.repository, 'hello\n');

    expect(first.hash).toBe(hashBlob(hasher, 'hello\n'));
    expect(second.repository).toBe(first.repository);
  });

  it('stages additions and deletions from the working tree', () => {
    const repository = buildRepository([], {});
    const staged = stageWorkingTreePath(hasher, repository, { 'a.txt': 'a\n' }, 'a.txt');
    expect(Object.keys(staged.index)).toEqual(['a.txt']);

    const removed = stageWorkingTreePath(hasher, staged, {}, 'a.txt');
    expect(removed.index).toEqual({});
  });
});
