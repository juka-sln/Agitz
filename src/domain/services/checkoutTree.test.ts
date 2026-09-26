import { buildRepository, fakeHash } from '@/test/fixtures/repositoryFixtures';

import {
  LocalChangesWouldBeOverwrittenError,
  UntrackedFilesWouldBeOverwrittenError,
} from '../errors/WorkingTreeErrors';

import { checkoutTree } from './checkoutTree';

const MAIN = fakeHash('a');
const FEATURE = fakeHash('b');

const repository = buildRepository(
  [
    { hash: MAIN, files: { 'shared.txt': 'shared\n', 'app.txt': 'main\n' } },
    {
      hash: FEATURE,
      parents: [MAIN],
      files: { 'shared.txt': 'shared\n', 'app.txt': 'feature\n', 'new.txt': 'new\n' },
    },
  ],
  { main: MAIN, feature: FEATURE },
);
const featureTree = repository.commits[FEATURE]?.tree ?? {};
const cleanFiles = { 'shared.txt': 'shared\n', 'app.txt': 'main\n' };

describe('checkoutTree', () => {
  it('updates index and working tree to the target snapshot', () => {
    const result = checkoutTree(repository, cleanFiles, featureTree, 'checkout');

    expect(result.index).toEqual(featureTree);
    expect(result.files).toEqual({
      'shared.txt': 'shared\n',
      'app.txt': 'feature\n',
      'new.txt': 'new\n',
    });
  });

  it('carries local changes on files that do not differ between snapshots', () => {
    const files = { ...cleanFiles, 'shared.txt': 'edited\n', 'scratch.txt': 'untracked\n' };
    const result = checkoutTree(repository, files, featureTree, 'checkout');

    expect(result.files['shared.txt']).toBe('edited\n');
    expect(result.files['scratch.txt']).toBe('untracked\n');
  });

  it('refuses to overwrite local changes on files that differ', () => {
    const files = { ...cleanFiles, 'app.txt': 'edited\n' };

    expect(() => checkoutTree(repository, files, featureTree, 'checkout')).toThrow(
      LocalChangesWouldBeOverwrittenError,
    );
  });

  it('refuses to overwrite an untracked file', () => {
    const files = { ...cleanFiles, 'new.txt': 'mine\n' };

    expect(() => checkoutTree(repository, files, featureTree, 'checkout')).toThrow(
      UntrackedFilesWouldBeOverwrittenError,
    );
  });
});
