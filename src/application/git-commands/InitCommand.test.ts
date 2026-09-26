import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { InitCommand } from './InitCommand';

describe('InitCommand', () => {
  const init = new InitCommand();

  it('creates an empty repository on an unborn main branch', () => {
    const bench = new GitTestBench();
    const result = bench.run(init, {});

    expect(result.output).toBe('Initialized empty Git repository in /home/alice/project/.git/');
    expect(result.explanation).toEqual({ key: 'init.created', params: { branch: 'main' } });
    expect(result.diffState.repositoryCreated).toBe(true);
    expect(bench.repository.head).toEqual({ type: 'attached', branch: 'main' });
    expect(bench.repository.branches).toEqual({});
  });

  it('keeps existing files untracked', () => {
    const bench = new GitTestBench().write({ 'README.md': '# Hi\n' });
    bench.run(init, {});

    expect(bench.workspace.files).toEqual({ 'README.md': '# Hi\n' });
    expect(bench.repository.index).toEqual({});
  });

  it('supports a custom initial branch', () => {
    const bench = new GitTestBench();
    bench.run(init, { initialBranch: 'trunk' });

    expect(bench.repository.head).toEqual({ type: 'attached', branch: 'trunk' });
  });

  it('rejects an invalid initial branch name', () => {
    const result = new GitTestBench().run(init, { initialBranch: 'bad name' });

    expect(result.exitCode).toBe(128);
    expect(result.output).toBe("fatal: invalid initial branch name: 'bad name'");
  });

  it('reinitializes without touching an existing repository', () => {
    const bench = new GitTestBench();
    bench.run(init, {});
    const repository = bench.repository;
    const result = bench.run(init, { initialBranch: 'other' });

    expect(result.output).toBe(
      [
        'warning: re-init: ignored --initial-branch=other',
        'Reinitialized existing Git repository in /home/alice/project/.git/',
      ].join('\n'),
    );
    expect(bench.repository).toBe(repository);
  });
});
