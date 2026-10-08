import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { AddCommand } from './AddCommand';
import { InitCommand } from './InitCommand';

function setup(files: Record<string, string>) {
  const bench = new GitTestBench().write(files);
  bench.run(new InitCommand(), {});
  return { bench, add: new AddCommand(bench.context) };
}

describe('AddCommand', () => {
  it('fails outside a repository', () => {
    const bench = new GitTestBench();
    const result = bench.run(new AddCommand(bench.context), { pathspecs: ['.'] });

    expect(result.exitCode).toBe(128);
    expect(result.explanation.key).toBe('error.notAGitRepository');
  });

  it('stages a single file and stores its content as a blob', () => {
    const { bench, add } = setup({ 'a.txt': 'a\n', 'b.txt': 'b\n' });
    const result = bench.run(add, { pathspecs: ['a.txt'] });

    expect(result.output).toBe('');
    expect(result.diffState.indexChanged).toBe(true);
    expect(Object.keys(bench.repository.index)).toEqual(['a.txt']);
    expect(Object.values(bench.repository.blobs)).toEqual(['a\n']);
    expect(result.explanation).toEqual({ key: 'add.staged', params: { count: 1, paths: 'a.txt' } });
  });

  it('stages a whole directory or the whole working tree', () => {
    const { bench, add } = setup({ 'src/a.ts': 'a', 'src/b.ts': 'b', 'README.md': 'r' });
    bench.run(add, { pathspecs: ['src'] });
    expect(Object.keys(bench.repository.index).sort()).toEqual(['src/a.ts', 'src/b.ts']);

    bench.run(add, { pathspecs: ['.'] });
    expect(Object.keys(bench.repository.index)).toHaveLength(3);
  });

  it('stages deletions of tracked files', () => {
    const { bench, add } = setup({ 'a.txt': 'a' });
    bench.run(add, { pathspecs: ['.'] });
    bench.remove('a.txt');
    bench.run(add, { pathspecs: ['a.txt'] });

    expect(bench.repository.index).toEqual({});
  });

  it('only stages tracked files with --update', () => {
    const { bench, add } = setup({ 'tracked.txt': 'v1' });
    bench.run(add, { pathspecs: ['.'] });
    bench.write({ 'tracked.txt': 'v2', 'new.txt': 'new' });
    bench.run(add, { pathspecs: [], update: true });

    expect(Object.keys(bench.repository.index)).toEqual(['tracked.txt']);
    expect(bench.repository.blobs[bench.repository.index['tracked.txt'] ?? '']).toBe('v2');
  });

  it('stages everything with --all and no pathspec', () => {
    const { bench, add } = setup({ 'a.txt': 'a', 'dir/b.txt': 'b' });
    bench.run(add, { pathspecs: [], all: true });

    expect(Object.keys(bench.repository.index)).toHaveLength(2);
  });

  it('warns when nothing is specified', () => {
    const { bench, add } = setup({ 'a.txt': 'a' });
    const result = bench.run(add, { pathspecs: [] });

    expect(result.output).toContain('Nothing specified, nothing added.');
    expect(bench.repository.index).toEqual({});
  });

  it('fails without staging anything when a pathspec matches nothing', () => {
    const { bench, add } = setup({ 'a.txt': 'a' });
    const result = bench.run(add, { pathspecs: ['a.txt', 'missing.txt'] });

    expect(result.exitCode).toBe(128);
    expect(result.output).toBe("fatal: pathspec 'missing.txt' did not match any files");
    expect(bench.repository.index).toEqual({});
  });

  it('reports when the index is already up to date', () => {
    const { bench, add } = setup({ 'a.txt': 'a' });
    bench.run(add, { pathspecs: ['.'] });

    expect(bench.run(add, { pathspecs: ['.'] }).explanation.key).toBe('add.nothingChanged');
  });
});
