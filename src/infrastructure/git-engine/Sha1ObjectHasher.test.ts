import { hashBlob } from '@/application/git-commands/support/objects';

import { Sha1ObjectHasher } from './Sha1ObjectHasher';

describe('Sha1ObjectHasher', () => {
  const hasher = new Sha1ObjectHasher();

  it.each([
    ['hello world\n', '3b18e512dba79e4c8300dd08aeb37f8e728b8dad'],
    ['', 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391'],
    ['café ☕\n', 'df113425d6f29a3f8cfb2ca897bebf8703e56d20'],
    ['a'.repeat(1000), 'a50be72b20f0e3f078d252e8e56b11b4bec67509'],
  ])('gives blob %j the same id as git hash-object', (content, expected) => {
    expect(hashBlob(hasher, content)).toBe(expected);
  });
});
