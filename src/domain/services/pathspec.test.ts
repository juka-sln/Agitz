import { InvalidPathError } from '../errors/WorkingTreeErrors';

import { parsePathspec } from './pathspec';

const matching = (pathspec: string, paths: string[]) =>
  paths.filter(parsePathspec(pathspec, '/home/alice/project').matches);

describe('parsePathspec', () => {
  const paths = ['README.md', 'src/app.ts', 'src/app.test.ts', 'src/lib/util.ts', 'srcx/file.ts'];

  it('matches everything with "."', () => {
    expect(matching('.', paths)).toEqual(paths);
  });

  it('matches a single file', () => {
    expect(matching('README.md', paths)).toEqual(['README.md']);
  });

  it('matches every file below a directory without matching similar prefixes', () => {
    expect(matching('src', paths)).toEqual(['src/app.ts', 'src/app.test.ts', 'src/lib/util.ts']);
  });

  it('supports globs where * crosses directory separators', () => {
    expect(matching('*.test.ts', paths)).toEqual(['src/app.test.ts']);
    expect(matching('src/*.ts', paths)).toEqual([
      'src/app.ts',
      'src/app.test.ts',
      'src/lib/util.ts',
    ]);
  });

  it('refuses paths outside the repository', () => {
    expect(() => parsePathspec('../secret', '/home/alice/project')).toThrow(InvalidPathError);
  });
});
