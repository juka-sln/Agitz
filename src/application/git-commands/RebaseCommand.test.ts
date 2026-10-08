import { collectReachableCommits } from '@/domain/services/history';
import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { AddCommand } from './AddCommand';
import { CheckoutCommand } from './CheckoutCommand';
import { RebaseCommand } from './RebaseCommand';
import { StatusCommand } from './StatusCommand';

/** main and feature both moved after `feat: base`. */
function setup(featureFiles: Record<string, string> = { 'login.txt': 'login\n' }) {
  const bench = new GitTestBench().init();
  bench.commit('feat: base', { 'app.txt': 'base\n' });
  const checkout = new CheckoutCommand(bench.context);
  bench.run(checkout, { targets: [], newBranch: 'feature' });
  bench.commit('feat: login', featureFiles);
  bench.commit('feat: login tests', { 'login.test.txt': 'tests\n' });
  const originalTip = bench.headCommit.hash;
  bench.run(checkout, { targets: ['main'] });
  bench.commit('fix: main hotfix', { 'app.txt': 'hotfix\n' });
  const mainTip = bench.headCommit.hash;
  bench.run(checkout, { targets: ['feature'] });
  return { bench, rebase: new RebaseCommand(bench.context), originalTip, mainTip };
}

describe('RebaseCommand', () => {
  it('replays the branch commits on top of the upstream', () => {
    const { bench, rebase, originalTip, mainTip } = setup();
    const result = bench.run(rebase, { action: 'start', upstream: 'main' });

    expect(result.output).toBe('Successfully rebased and updated refs/heads/feature.');
    expect(bench.repository.head).toEqual({ type: 'attached', branch: 'feature' });
    expect(bench.headCommit.message).toBe('feat: login tests');
    expect(bench.headCommit.hash).not.toBe(originalTip);
    expect(collectReachableCommits(bench.repository, [bench.headCommit.hash]).has(mainTip)).toBe(
      true,
    );
    expect(bench.workspace.files['app.txt']).toBe('hotfix\n');
    expect(result.diffState.createdCommits).toHaveLength(2);
  });

  it('says when the branch is already up to date', () => {
    const { bench, rebase } = setup();
    bench.run(rebase, { action: 'start', upstream: 'main' });

    expect(bench.run(rebase, { action: 'start', upstream: 'main' }).output).toBe(
      'Current branch feature is up to date.',
    );
  });

  it('stops on a conflict, shows progress in status, and continues', () => {
    const { bench, rebase } = setup({ 'app.txt': 'feature\n' });
    const result = bench.run(rebase, { action: 'start', upstream: 'main' });

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain(
      'hint: Resolve all conflicts manually, mark them as resolved with',
    );
    const status = bench.run(new StatusCommand(), {}).output;
    expect(status).toMatch(
      /^interactive rebase in progress; onto [0-9a-f]{7}\nLast command done \(1 command done\):/,
    );
    expect(status).toContain("You are currently rebasing branch 'feature' on");

    bench.write({ 'app.txt': 'hotfix and feature\n' });
    bench.run(new AddCommand(bench.context), { pathspecs: ['app.txt'] });
    const continued = bench.run(rebase, { action: 'continue' });

    expect(continued.output).toBe('Successfully rebased and updated refs/heads/feature.');
    expect(bench.headCommit.message).toBe('feat: login tests');
    expect(bench.workspace.files['app.txt']).toBe('hotfix and feature\n');
  });

  it('aborts back to the original branch tip', () => {
    const { bench, rebase, originalTip } = setup({ 'app.txt': 'feature\n' });
    bench.run(rebase, { action: 'start', upstream: 'main' });
    bench.run(rebase, { action: 'abort' });

    expect(bench.repository.head).toEqual({ type: 'attached', branch: 'feature' });
    expect(bench.headCommit.hash).toBe(originalTip);
    expect(bench.workspace.files['app.txt']).toBe('feature\n');
  });

  it('skips the conflicting commit', () => {
    const { bench, rebase } = setup({ 'app.txt': 'feature\n' });
    bench.run(rebase, { action: 'start', upstream: 'main' });
    bench.run(rebase, { action: 'skip' });

    expect(bench.headCommit.message).toBe('feat: login tests');
    expect(bench.workspace.files['app.txt']).toBe('hotfix\n');
  });

  it('refuses to start with uncommitted changes', () => {
    const { bench, rebase } = setup();
    bench.write({ 'login.txt': 'wip\n' });

    expect(bench.run(rebase, { action: 'start', upstream: 'main' }).output).toBe(
      'error: cannot rebase: You have unstaged changes.\nerror: Please commit or stash them.',
    );
  });
});
