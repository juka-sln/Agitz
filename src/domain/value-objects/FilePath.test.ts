import { normalizePath, parentDirectories } from './FilePath';

describe('normalizePath', () => {
  it.each([
    ['./src//app.ts', 'src/app.ts'],
    ['src/', 'src'],
    ['.', ''],
    ['', ''],
  ])('normalizes %j to %j', (raw, expected) => {
    expect(normalizePath(raw)).toBe(expected);
  });

  it.each(['../outside', 'src/../../x', '.git/config'])('rejects %j', (raw) => {
    expect(normalizePath(raw)).toBeNull();
  });
});

describe('parentDirectories', () => {
  it('lists every ancestor directory from the root down', () => {
    expect(parentDirectories('a/b/c.txt')).toEqual(['a', 'a/b']);
    expect(parentDirectories('file.txt')).toEqual([]);
  });
});
