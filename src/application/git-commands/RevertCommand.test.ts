import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { RevertCommand } from './RevertCommand';

describe('RevertCommand', () => {
  it('records a new commit that undoes an older one', () => {
    const bench = new GitTestBench().init();
    bench.commit('feat: base', { 'app.txt': 'one\ntwo\nthree\n' });
    bench.commit('feat: risky change', { 'app.txt': 'one\nTWO\nthree\n' });
    const risky = bench.headCommit;
    bench.commit('docs: add notes', { 'notes.txt': 'notes\n' });

    const result = bench.run(new RevertCommand(bench.context), {
      action: 'start',
      commits: ['HEAD~1'],
    });

    expect(result.output.split('\n')[0]).toMatch(
      /^\[main [0-9a-f]{7}\] Revert "feat: risky change"$/,
    );
    expect(bench.headCommit.message).toBe(
      `Revert "feat: risky change"\n\nThis reverts commit ${risky.hash}.`,
    );
    expect(bench.workspace.files).toEqual({
      'app.txt': 'one\ntwo\nthree\n',
      'notes.txt': 'notes\n',
    });
    expect(result.diffState.createdCommits).toHaveLength(1);
  });

  it('stops on a conflict when later commits changed the same lines', () => {
    const bench = new GitTestBench().init();
    bench.commit('feat: base', { 'app.txt': 'v1\n' });
    bench.commit('feat: v2', { 'app.txt': 'v2\n' });
    bench.commit('feat: v3', { 'app.txt': 'v3\n' });
    const revert = new RevertCommand(bench.context);

    const result = bench.run(revert, { action: 'start', commits: ['HEAD~1'] });
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('error: could not revert');
    expect(bench.repository.operation?.type).toBe('revert');

    bench.run(revert, { action: 'abort' });
    expect(bench.workspace.files['app.txt']).toBe('v3\n');
  });
});
