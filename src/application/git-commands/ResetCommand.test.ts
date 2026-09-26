import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { AddCommand } from './AddCommand';
import { ResetCommand } from './ResetCommand';

/** Three commits on main; the last one changes app.txt and adds extra.txt. */
function setup() {
  const bench = new GitTestBench().init();
  bench.commit('feat: v1', { 'app.txt': 'v1\n' });
  const v1 = bench.headCommit;
  bench.commit('feat: v2', { 'app.txt': 'v2\n' });
  bench.commit('feat: v3', { 'app.txt': 'v3\n', 'extra.txt': 'extra\n' });
  return { bench, reset: new ResetCommand(), v1 };
}

describe('ResetCommand', () => {
  it('--soft only moves the branch and keeps the changes staged', () => {
    const { bench, reset } = setup();
    const result = bench.run(reset, { mode: 'soft', targets: ['HEAD~1'] });

    expect(result.output).toBe('');
    expect(bench.headCommit.message).toBe('feat: v2');
    expect(bench.workspace.files['app.txt']).toBe('v3\n');
    expect(bench.repository.index['extra.txt']).toBeDefined();
  });

  it('--mixed (default) also resets the index and lists unstaged changes', () => {
    const { bench, reset } = setup();
    const result = bench.run(reset, { targets: ['HEAD~1'] });

    expect(result.output).toBe('Unstaged changes after reset:\nM\tapp.txt');
    expect(bench.repository.index['extra.txt']).toBeUndefined();
    expect(bench.workspace.files['extra.txt']).toBe('extra\n');
  });

  it('--hard rewrites tracked files but keeps untracked ones', () => {
    const { bench, reset, v1 } = setup();
    bench.write({ 'notes.txt': 'mine\n' });
    const result = bench.run(reset, { mode: 'hard', targets: [v1.hash.slice(0, 7)] });

    expect(result.output).toMatch(/^HEAD is now at [0-9a-f]{7} feat: v1$/);
    expect(bench.workspace.files).toEqual({ 'app.txt': 'v1\n', 'notes.txt': 'mine\n' });
    expect(result.diffState.refUpdates[0]?.after).toBe(v1.hash);
  });

  it('unstages a file with git reset <path>', () => {
    const { bench, reset } = setup();
    bench.write({ 'app.txt': 'v4\n' });
    bench.run(new AddCommand(bench.context), { pathspecs: ['app.txt'] });
    const result = bench.run(reset, { targets: ['app.txt'] });

    expect(result.output).toBe('Unstaged changes after reset:\nM\tapp.txt');
    expect(bench.repository.index['app.txt']).toBe(bench.headCommit.tree['app.txt']);
    expect(bench.headCommit.message).toBe('feat: v3');
  });

  it('refuses hard resets on paths', () => {
    const { bench, reset } = setup();

    expect(bench.run(reset, { mode: 'hard', targets: ['HEAD'], paths: ['app.txt'] }).output).toBe(
      'fatal: Cannot do hard reset with paths.',
    );
  });
});
