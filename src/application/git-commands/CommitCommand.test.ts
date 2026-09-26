import { shortHash } from '@/domain/value-objects/Hash';
import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { AddCommand } from './AddCommand';
import { CommitCommand } from './CommitCommand';

function setup() {
  const bench = new GitTestBench().init();
  return { bench, add: new AddCommand(bench.context), commit: new CommitCommand(bench.context) };
}

describe('CommitCommand', () => {
  it('records the index as a root commit and moves the current branch', () => {
    const { bench, add, commit } = setup();
    bench.write({ 'README.md': '# Agitz\n' });
    bench.run(add, { pathspecs: ['.'] });
    const result = bench.run(commit, { messages: ['docs: add readme'] });

    const created = bench.headCommit;
    expect(result.output).toBe(
      [
        `[main (root-commit) ${shortHash(created.hash)}] docs: add readme`,
        ' 1 file changed, 1 insertion(+)',
        ' create mode 100644 README.md',
      ].join('\n'),
    );
    expect(created.parents).toEqual([]);
    expect(created.author).toEqual({ name: 'Alice', email: 'alice@example.com' });
    expect(result.diffState.createdCommits).toEqual([created.hash]);
    expect(result.diffState.refUpdates).toEqual([
      { branch: 'main', before: null, after: created.hash },
    ]);
    expect(result.explanation.key).toBe('commit.createdRoot');
  });

  it('chains commits and reports line statistics', () => {
    const { bench, add, commit } = setup();
    const first = bench.commit('feat: add app', { 'app.txt': 'one\ntwo\n', 'old.txt': 'x\n' });
    bench.write({ 'app.txt': 'one\n2\nthree\n' }).remove('old.txt');
    bench.run(add, { pathspecs: ['.'] });
    const result = bench.run(commit, { messages: ['refactor: rework app'] });

    expect(bench.headCommit.parents).toEqual([first.diffState.createdCommits[0]]);
    expect(result.output.split('\n').slice(1)).toEqual([
      ' 2 files changed, 2 insertions(+), 2 deletions(-)',
      ' delete mode 100644 old.txt',
    ]);
    expect(result.explanation.key).toBe('commit.created');
  });

  it('joins several messages as paragraphs', () => {
    const { bench, add, commit } = setup();
    bench.write({ 'a.txt': 'a' });
    bench.run(add, { pathspecs: ['.'] });
    bench.run(commit, { messages: ['feat: add a', 'Explain why.'] });

    expect(bench.headCommit.message).toBe('feat: add a\n\nExplain why.');
  });

  it('refuses to commit when nothing is staged', () => {
    const { bench, commit } = setup();
    bench.commit('chore: init', { 'a.txt': 'a' });
    bench.write({ 'a.txt': 'changed' });
    const result = bench.run(commit, { messages: ['nothing'] });

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('no changes added to commit');
    expect(result.explanation.key).toBe('commit.nothingToCommit');
    expect(result.diffState.createdCommits).toEqual([]);
  });

  it('stages tracked changes with --all but ignores untracked files', () => {
    const { bench, commit } = setup();
    bench.commit('chore: init', { 'a.txt': 'a' });
    bench.write({ 'a.txt': 'changed', 'untracked.txt': 'u' });
    bench.run(commit, { messages: ['fix: change a'], all: true });

    expect(Object.keys(bench.repository.index)).toEqual(['a.txt']);
    expect(bench.run(commit, { messages: ['again'] }).exitCode).toBe(1);
  });

  it('aborts on an empty message', () => {
    const { bench, add, commit } = setup();
    bench.write({ 'a.txt': 'a' });
    bench.run(add, { pathspecs: ['.'] });
    const result = bench.run(commit, { messages: ['   '] });

    expect(result.exitCode).toBe(1);
    expect(result.output).toBe('Aborting commit due to empty commit message.');
    expect(bench.repository.branches).toEqual({});
  });

  it('allows empty commits on request', () => {
    const { bench, commit } = setup();
    bench.commit('chore: init', { 'a.txt': 'a' });
    const result = bench.run(commit, { messages: ['ci: trigger build'], allowEmpty: true });

    expect(result.exitCode).toBe(0);
    expect(result.output).toMatch(/^\[main [0-9a-f]{7}\] ci: trigger build$/);
  });
});
