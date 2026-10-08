import { buildFileTree } from './buildFileTree';

const entry = (path: string) => ({ path, staged: null, unstaged: null, conflict: null });

describe('buildFileTree', () => {
  it('emits each directory once with increasing depth', () => {
    const rows = buildFileTree([
      entry('README.md'),
      entry('src/a.ts'),
      entry('src/lib/b.ts'),
      entry('src/z.ts'),
    ]);

    expect(rows.map((row) => [row.kind, row.name, row.depth])).toEqual([
      ['file', 'README.md', 0],
      ['directory', 'src', 0],
      ['file', 'a.ts', 1],
      ['directory', 'lib', 1],
      ['file', 'b.ts', 2],
      ['file', 'z.ts', 1],
    ]);
  });
});
