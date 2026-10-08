import { AddCommand } from '@/application/git-commands/AddCommand';
import { CheckoutCommand } from '@/application/git-commands/CheckoutCommand';
import { MergeCommand } from '@/application/git-commands/MergeCommand';
import { RebaseCommand } from '@/application/git-commands/RebaseCommand';
import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { getConflictResolution } from './getConflictResolution';

/** `main` and `feature` both changed the only line of `app.txt`; HEAD is on `main`. */
function divergedBench() {
  const bench = new GitTestBench().init();
  const checkout = new CheckoutCommand(bench.context);
  bench.commit('feat: base', { 'app.txt': 'base\n', 'my notes.txt': 'base\n' });
  bench.run(checkout, { targets: [], newBranch: 'feature' });
  bench.commit('feat: theirs', { 'app.txt': 'theirs\n', 'my notes.txt': 'theirs\n' });
  bench.run(checkout, { targets: ['main'] });
  bench.commit('feat: ours', { 'app.txt': 'ours\n', 'my notes.txt': 'ours\n' });
  return bench;
}

describe('getConflictResolution', () => {
  it('has nothing to report without a conflict', () => {
    expect(getConflictResolution(new GitTestBench().workspace)).toBeNull();
    expect(getConflictResolution(divergedBench().workspace)).toBeNull();
  });

  it('asks to fix the files of a stopped merge', () => {
    const bench = divergedBench();
    bench.run(new MergeCommand(bench.context), { action: 'merge', target: 'feature' });

    expect(getConflictResolution(bench.workspace)).toEqual({
      operation: 'merge',
      files: [
        {
          path: 'app.txt',
          type: 'both modified',
          step: 'resolve',
          stageCommand: 'git add app.txt',
        },
        {
          path: 'my notes.txt',
          type: 'both modified',
          step: 'resolve',
          stageCommand: 'git add "my notes.txt"',
        },
      ],
      continueCommand: 'git commit',
      abortCommand: 'git merge --abort',
    });
  });

  it('asks to stage a file once its markers are gone, then to conclude', () => {
    const bench = divergedBench();
    bench.run(new MergeCommand(bench.context), { action: 'merge', target: 'feature' });
    bench.write({ 'app.txt': 'ours and theirs\n', 'my notes.txt': 'ours\n' });

    expect(getConflictResolution(bench.workspace)?.files.map((file) => file.step)).toEqual([
      'stage',
      'stage',
    ]);

    bench.run(new AddCommand(bench.context), { pathspecs: ['.'] });

    expect(getConflictResolution(bench.workspace)).toMatchObject({
      files: [],
      continueCommand: 'git commit',
    });
  });

  it('continues a rebase with --continue', () => {
    const bench = divergedBench();
    bench.run(new RebaseCommand(bench.context), { action: 'start', upstream: 'feature' });

    expect(getConflictResolution(bench.workspace)).toMatchObject({
      operation: 'rebase',
      continueCommand: 'git rebase --continue',
      abortCommand: 'git rebase --abort',
    });
  });
});
