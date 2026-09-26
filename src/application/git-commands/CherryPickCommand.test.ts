import { shortHash } from '@/domain/value-objects/Hash';
import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { AddCommand } from './AddCommand';
import { CheckoutCommand } from './CheckoutCommand';
import { CherryPickCommand } from './CherryPickCommand';
import { StatusCommand } from './StatusCommand';

/** `feature` has two commits that main does not have. */
function setup() {
  const bench = new GitTestBench().init();
  bench.commit('feat: base', { 'app.txt': 'base\n' });
  const checkout = new CheckoutCommand(bench.context);
  bench.run(checkout, { targets: [], newBranch: 'feature' });
  bench.commit('fix: urgent bug', { 'fix.txt': 'fix\n' });
  const fix = bench.headCommit;
  bench.commit('feat: edit app', { 'app.txt': 'feature\n' });
  const edit = bench.headCommit;
  bench.run(checkout, { targets: ['main'] });
  return { bench, fix, edit, pick: new CherryPickCommand(bench.context) };
}

describe('CherryPickCommand', () => {
  it('copies a commit onto the current branch, keeping its author and message', () => {
    const { bench, fix, pick } = setup();
    const result = bench.run(pick, { action: 'start', commits: [shortHash(fix.hash)] });

    expect(result.output).toMatch(
      /^\[main [0-9a-f]{7}\] fix: urgent bug\n Date: Thu Jan 15 10:01:00 2026 \+0100\n 1 file changed, 1 insertion\(\+\)\n create mode 100644 fix.txt$/,
    );
    expect(bench.headCommit.hash).not.toBe(fix.hash);
    expect(bench.headCommit.message).toBe(fix.message);
    expect(bench.headCommit.authoredAt).toEqual(fix.authoredAt);
    expect(bench.headCommit.committedAt).not.toEqual(fix.committedAt);
    expect(bench.workspace.files['fix.txt']).toBe('fix\n');
  });

  it('stops on a conflict and continues once resolved', () => {
    const { bench, edit, pick } = setup();
    bench.commit('feat: main edits app', { 'app.txt': 'main\n' });
    const result = bench.run(pick, { action: 'start', commits: ['feature'] });

    expect(result.exitCode).toBe(1);
    expect(result.output.split('\n').slice(0, 3)).toEqual([
      'Auto-merging app.txt',
      'CONFLICT (content): Merge conflict in app.txt',
      `error: could not apply ${shortHash(edit.hash)}... feat: edit app`,
    ]);
    expect(bench.workspace.files['app.txt']).toContain(
      `>>>>>>> ${shortHash(edit.hash)} (feat: edit app)`,
    );
    expect(bench.run(new StatusCommand(), {}).output).toContain(
      `You are currently cherry-picking commit ${shortHash(edit.hash)}.`,
    );

    bench.write({ 'app.txt': 'main and feature\n' });
    bench.run(new AddCommand(bench.context), { pathspecs: ['app.txt'] });
    bench.run(pick, { action: 'continue' });

    expect(bench.headCommit.message).toBe('feat: edit app');
    expect(bench.repository.operation).toBeNull();
  });

  it('aborts back to the original commit', () => {
    const { bench, pick } = setup();
    bench.commit('feat: main edits app', { 'app.txt': 'main\n' });
    const before = bench.headCommit.hash;
    bench.run(pick, { action: 'start', commits: ['feature~1', 'feature'] });
    bench.run(pick, { action: 'abort' });

    expect(bench.headCommit.hash).toBe(before);
    expect(bench.workspace.files['app.txt']).toBe('main\n');
    expect(bench.workspace.files['fix.txt']).toBeUndefined();
  });

  it('rejects unknown revisions and merge commits', () => {
    const { bench, pick } = setup();
    expect(bench.run(pick, { action: 'start', commits: ['nope'] }).output).toBe(
      "fatal: bad revision 'nope'",
    );
    expect(bench.run(pick, { action: 'continue' }).output).toBe(
      'error: no cherry-pick in progress\nfatal: cherry-pick failed',
    );
  });
});
