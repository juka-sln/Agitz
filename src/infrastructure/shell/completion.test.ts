import { createWorkspace, writeFile } from '@/domain/entities/Workspace';
import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { completeCommandLine } from './completion';

const shellCommands = ['cat', 'clear', 'echo', 'ls'];
const gitCommands = ['add', 'branch', 'checkout', 'commit'];

describe('completeCommandLine', () => {
  const workspace = ['src/app.ts', 'src/lib/util.ts', 'README.md'].reduce(
    (current, path) => writeFile(current, path, ''),
    createWorkspace('/home/alice/project', { name: 'Alice', email: 'a@example.com' }),
  );
  const complete = (line: string) =>
    completeCommandLine(line, workspace, shellCommands, gitCommands);

  it('completes command names', () => {
    expect(complete('c')).toEqual({ word: 'c', candidates: ['cat', 'clear'] });
    expect(complete('git c')).toEqual({ word: 'c', candidates: ['checkout', 'commit'] });
  });

  it('completes paths one folder at a time', () => {
    expect(complete('git add s').candidates).toEqual(['src/']);
    expect(complete('cat src/').candidates).toEqual(['src/app.ts', 'src/lib/']);
    expect(complete('cat nope/').candidates).toEqual([]);
  });

  it('completes branch names for commands that take revisions', () => {
    const bench = new GitTestBench().init();
    bench.commit('feat: add a', { 'a.txt': 'a' });
    const result = completeCommandLine(
      'git checkout ',
      bench.workspace,
      shellCommands,
      gitCommands,
    );

    expect(result.candidates).toEqual(['a.txt', 'main']);
  });
});
