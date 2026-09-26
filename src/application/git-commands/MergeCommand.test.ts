import { shortHash } from '@/domain/value-objects/Hash';
import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { AddCommand } from './AddCommand';
import { CheckoutCommand } from './CheckoutCommand';
import { CommitCommand } from './CommitCommand';
import { MergeCommand } from './MergeCommand';
import { StatusCommand } from './StatusCommand';

/** main has one commit; `feature` branches from it. */
function setup() {
  const bench = new GitTestBench().init();
  bench.commit('feat: base', { 'app.txt': 'line 1\nline 2\nline 3\n', 'shared.txt': 'shared\n' });
  const checkout = new CheckoutCommand(bench.context);
  const merge = new MergeCommand(bench.context);
  const onBranch = (branch: string) => bench.run(checkout, { targets: [branch] });
  bench.run(checkout, { targets: [], newBranch: 'feature' });
  return { bench, merge, onBranch };
}

describe('MergeCommand', () => {
  it('fast-forwards when the current branch has not moved', () => {
    const { bench, merge, onBranch } = setup();
    bench.commit('feat: add login', { 'login.txt': 'login\n' });
    const feature = bench.headCommit.hash;
    onBranch('main');
    const main = bench.headCommit.hash;
    const result = bench.run(merge, { action: 'merge', target: 'feature' });

    expect(result.output).toBe(
      [
        `Updating ${shortHash(main)}..${shortHash(feature)}`,
        'Fast-forward',
        ' login.txt | 1 +',
        ' 1 file changed, 1 insertion(+)',
        ' create mode 100644 login.txt',
      ].join('\n'),
    );
    expect(bench.repository.branches.main).toBe(feature);
    expect(bench.workspace.files['login.txt']).toBe('login\n');
  });

  it('creates a merge commit with --no-ff', () => {
    const { bench, merge, onBranch } = setup();
    bench.commit('feat: add login', { 'login.txt': 'login\n' });
    const feature = bench.headCommit.hash;
    onBranch('main');
    const main = bench.headCommit.hash;
    const result = bench.run(merge, { action: 'merge', target: 'feature', noFastForward: true });

    expect(result.output.split('\n')[0]).toBe("Merge made by the 'ort' strategy.");
    expect(bench.headCommit.parents).toEqual([main, feature]);
    expect(bench.headCommit.message).toBe("Merge branch 'feature'");
  });

  it('merges diverged branches automatically when changes do not overlap', () => {
    const { bench, merge, onBranch } = setup();
    bench.commit('feat: edit line 3', { 'app.txt': 'line 1\nline 2\nLINE 3\n' });
    onBranch('main');
    bench.commit('feat: edit line 1', { 'app.txt': 'LINE 1\nline 2\nline 3\n' });
    const result = bench.run(merge, { action: 'merge', target: 'feature' });

    expect(result.output.split('\n').slice(0, 2)).toEqual([
      'Auto-merging app.txt',
      "Merge made by the 'ort' strategy.",
    ]);
    expect(bench.workspace.files['app.txt']).toBe('LINE 1\nline 2\nLINE 3\n');
    expect(bench.headCommit.parents).toHaveLength(2);
    expect(result.diffState.createdCommits).toHaveLength(1);
  });

  it('stops on a conflict, then concludes with add and commit', () => {
    const { bench, merge, onBranch } = setup();
    bench.commit('feat: theirs', { 'app.txt': 'line 1\nfeature\nline 3\n' });
    onBranch('main');
    bench.commit('feat: ours', { 'app.txt': 'line 1\nmain\nline 3\n' });
    const main = bench.headCommit.hash;

    const result = bench.run(merge, { action: 'merge', target: 'feature' });
    expect(result).toMatchObject({
      exitCode: 1,
      output: [
        'Auto-merging app.txt',
        'CONFLICT (content): Merge conflict in app.txt',
        'Automatic merge failed; fix conflicts and then commit the result.',
      ].join('\n'),
    });
    expect(bench.workspace.files['app.txt']).toBe(
      'line 1\n<<<<<<< HEAD\nmain\n=======\nfeature\n>>>>>>> feature\nline 3\n',
    );
    expect(bench.run(new StatusCommand(), { short: true }).output).toBe('UU app.txt');

    const commit = new CommitCommand(bench.context);
    expect(bench.run(commit, { messages: [] }).output).toMatch(
      /^error: Committing is not possible because you have unmerged files\./,
    );
    expect(bench.run(new CheckoutCommand(bench.context), { targets: ['feature'] }).output).toBe(
      'app.txt: needs merge\nerror: you need to resolve your current index first',
    );

    bench.write({ 'app.txt': 'line 1\nmain and feature\nline 3\n' });
    expect(
      bench.run(new AddCommand(bench.context), { pathspecs: ['app.txt'] }).explanation.key,
    ).toBe('add.resolvedConflicts');
    const concluded = bench.run(merge, { action: 'continue' });

    expect(concluded.output).toMatch(/^\[main [0-9a-f]{7}\] Merge branch 'feature'$/);
    expect(bench.headCommit.parents[0]).toBe(main);
    expect(bench.repository.operation).toBeNull();
  });

  it('aborts a conflicted merge', () => {
    const { bench, merge, onBranch } = setup();
    bench.commit('feat: theirs', { 'app.txt': 'feature\n' });
    onBranch('main');
    bench.commit('feat: ours', { 'app.txt': 'main\n' });
    bench.run(merge, { action: 'merge', target: 'feature' });
    bench.run(merge, { action: 'abort' });

    expect(bench.workspace.files['app.txt']).toBe('main\n');
    expect(bench.repository.operation).toBeNull();
    expect(bench.repository.unmerged).toEqual({});
    expect(bench.run(merge, { action: 'abort' }).output).toBe(
      'fatal: There is no merge to abort (MERGE_HEAD missing).',
    );
  });

  it('handles up-to-date, fast-forward-only and unknown targets', () => {
    const { bench, merge, onBranch } = setup();
    onBranch('main');
    bench.commit('feat: main moves', { 'main.txt': 'm\n' });

    expect(bench.run(merge, { action: 'merge', target: 'feature' }).output).toBe(
      'Already up to date.',
    );
    onBranch('feature');
    bench.commit('feat: feature moves', { 'f.txt': 'f\n' });
    expect(
      bench.run(merge, { action: 'merge', target: 'main', fastForwardOnly: true }).output,
    ).toBe('fatal: Not possible to fast-forward, aborting.');
    expect(bench.run(merge, { action: 'merge', target: 'nope' }).output).toBe(
      'merge: nope - not something we can merge',
    );
  });

  it('names the destination branch when merging outside main', () => {
    const { bench, merge, onBranch } = setup();
    bench.commit('feat: on feature', { 'f.txt': 'f\n' });
    onBranch('main');
    bench.commit('feat: on main', { 'm.txt': 'm\n' });
    onBranch('feature');
    bench.run(merge, { action: 'merge', target: 'main' });

    expect(bench.headCommit.message).toBe("Merge branch 'main' into feature");
  });
});
