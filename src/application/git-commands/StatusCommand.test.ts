import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { AddCommand } from './AddCommand';
import { InitCommand } from './InitCommand';
import { StatusCommand } from './StatusCommand';

describe('StatusCommand', () => {
  const status = new StatusCommand();

  it('fails outside a repository', () => {
    expect(new GitTestBench().run(status, {}).exitCode).toBe(128);
  });

  it('shows staged and untracked files in long format', () => {
    const bench = new GitTestBench().write({ 'a.txt': 'a', 'b.txt': 'b' });
    bench.run(new InitCommand(), {});
    bench.run(new AddCommand(bench.context), { pathspecs: ['a.txt'] });
    const result = bench.run(status, {});

    expect(result.output).toBe(
      [
        'On branch main',
        '',
        'No commits yet',
        '',
        'Changes to be committed:',
        '  (use "git rm --cached <file>..." to unstage)',
        '\tnew file:   a.txt',
        '',
        'Untracked files:',
        '  (use "git add <file>..." to include in what will be committed)',
        '\tb.txt',
      ].join('\n'),
    );
    expect(result.explanation).toEqual({
      key: 'status.changes',
      params: { staged: 1, unstaged: 0, untracked: 1 },
    });
    expect(result.diffState.indexChanged).toBe(false);
  });

  it('supports the short format', () => {
    const bench = new GitTestBench().write({ 'a.txt': 'a', 'b.txt': 'b' });
    bench.run(new InitCommand(), {});
    bench.run(new AddCommand(bench.context), { pathspecs: ['a.txt'] });

    expect(bench.run(status, { short: true }).output).toBe('A  a.txt\n?? b.txt');
  });
});
