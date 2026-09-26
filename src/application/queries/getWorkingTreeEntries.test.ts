import { AddCommand } from '@/application/git-commands/AddCommand';
import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { getWorkingTreeEntries } from './getWorkingTreeEntries';

describe('getWorkingTreeEntries', () => {
  it('lists plain files before the repository exists', () => {
    const bench = new GitTestBench().write({ 'b.txt': 'b', 'a.txt': 'a' });

    expect(getWorkingTreeEntries(bench.workspace)).toEqual([
      { path: 'a.txt', staged: null, unstaged: null },
      { path: 'b.txt', staged: null, unstaged: null },
    ]);
  });

  it('describes the Git state of every file, deleted ones included', () => {
    const bench = new GitTestBench().init();
    bench.commit('feat: init', { 'clean.txt': 'c', 'edited.txt': 'v1', 'gone.txt': 'g' });
    bench.write({ 'edited.txt': 'v2', 'staged.txt': 's', 'new.txt': 'n' }).remove('gone.txt');
    bench.run(new AddCommand(bench.context), { pathspecs: ['staged.txt'] });

    expect(getWorkingTreeEntries(bench.workspace)).toEqual([
      { path: 'clean.txt', staged: null, unstaged: null },
      { path: 'edited.txt', staged: null, unstaged: 'modified' },
      { path: 'gone.txt', staged: null, unstaged: 'deleted' },
      { path: 'new.txt', staged: null, unstaged: 'untracked' },
      { path: 'staged.txt', staged: 'added', unstaged: null },
    ]);
  });
});
