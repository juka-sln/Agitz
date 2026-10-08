import { AddCommand } from '@/application/git-commands/AddCommand';
import { CheckoutCommand } from '@/application/git-commands/CheckoutCommand';
import { MergeCommand } from '@/application/git-commands/MergeCommand';
import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { getWorkingTreeEntries } from './getWorkingTreeEntries';

describe('getWorkingTreeEntries', () => {
  it('lists plain files before the repository exists', () => {
    const bench = new GitTestBench().write({ 'b.txt': 'b', 'a.txt': 'a' });

    expect(getWorkingTreeEntries(bench.workspace)).toEqual([
      { path: 'a.txt', staged: null, unstaged: null, conflict: null },
      { path: 'b.txt', staged: null, unstaged: null, conflict: null },
    ]);
  });

  it('describes the Git state of every file, deleted ones included', () => {
    const bench = new GitTestBench().init();
    bench.commit('feat: init', { 'clean.txt': 'c', 'edited.txt': 'v1', 'gone.txt': 'g' });
    bench.write({ 'edited.txt': 'v2', 'staged.txt': 's', 'new.txt': 'n' }).remove('gone.txt');
    bench.run(new AddCommand(bench.context), { pathspecs: ['staged.txt'] });

    expect(getWorkingTreeEntries(bench.workspace)).toEqual([
      { path: 'clean.txt', staged: null, unstaged: null, conflict: null },
      { path: 'edited.txt', staged: null, unstaged: 'modified', conflict: null },
      { path: 'gone.txt', staged: null, unstaged: 'deleted', conflict: null },
      { path: 'new.txt', staged: null, unstaged: 'untracked', conflict: null },
      { path: 'staged.txt', staged: 'added', unstaged: null, conflict: null },
    ]);
  });

  it('flags files with a merge conflict', () => {
    const bench = new GitTestBench().init();
    const checkout = new CheckoutCommand(bench.context);
    bench.commit('feat: base', { 'app.txt': 'base\n' });
    bench.run(checkout, { targets: [], newBranch: 'feature' });
    bench.commit('feat: theirs', { 'app.txt': 'theirs\n' });
    bench.run(checkout, { targets: ['main'] });
    bench.commit('feat: ours', { 'app.txt': 'ours\n' });
    bench.run(new MergeCommand(bench.context), { action: 'merge', target: 'feature' });

    expect(getWorkingTreeEntries(bench.workspace)).toEqual([
      { path: 'app.txt', staged: null, unstaged: null, conflict: 'both modified' },
    ]);
  });
});
