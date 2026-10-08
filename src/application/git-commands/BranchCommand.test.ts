import { shortHash } from '@/domain/value-objects/Hash';
import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { BranchCommand } from './BranchCommand';
import { CheckoutCommand } from './CheckoutCommand';

function setup() {
  const bench = new GitTestBench().init();
  bench.commit('feat: add a', { 'a.txt': 'a' });
  return bench;
}

describe('BranchCommand', () => {
  const branch = new BranchCommand();

  describe('list', () => {
    it('lists branches alphabetically and marks the current one', () => {
      const bench = setup();
      bench.run(branch, { action: 'create', name: 'feature' });
      bench.run(branch, { action: 'create', name: 'bugfix' });

      expect(bench.run(branch, { action: 'list' }).output).toBe('  bugfix\n  feature\n* main');
    });

    it('shows the last commit of each branch in verbose mode', () => {
      const bench = setup();
      const hash = shortHash(bench.headCommit.hash);
      bench.run(branch, { action: 'create', name: 'feature' });

      expect(bench.run(branch, { action: 'list', verbosity: 1 }).output).toBe(
        `  feature ${hash} feat: add a\n* main    ${hash} feat: add a`,
      );
    });

    it('shows a detached HEAD first', () => {
      const bench = setup();
      const hash = shortHash(bench.headCommit.hash);
      bench.run(new CheckoutCommand(bench.context), { targets: [], detach: true });

      expect(bench.run(branch, { action: 'list' }).output).toBe(
        `* (HEAD detached at ${hash})\n  main`,
      );
    });

    it('prints nothing on an unborn branch', () => {
      expect(new GitTestBench().init().run(branch, { action: 'list' }).output).toBe('');
    });
  });

  describe('create', () => {
    it('creates a branch at HEAD without switching to it', () => {
      const bench = setup();
      const result = bench.run(branch, { action: 'create', name: 'feature' });

      expect(result.output).toBe('');
      expect(bench.repository.branches.feature).toBe(bench.headCommit.hash);
      expect(bench.repository.head).toEqual({ type: 'attached', branch: 'main' });
      expect(result.diffState.refUpdates).toEqual([
        { branch: 'feature', before: null, after: bench.headCommit.hash },
      ]);
    });

    it('creates a branch at a start point', () => {
      const bench = setup();
      const first = bench.headCommit.hash;
      bench.commit('feat: add b', { 'b.txt': 'b' });
      bench.run(branch, { action: 'create', name: 'old', startPoint: 'HEAD~1' });

      expect(bench.repository.branches.old).toBe(first);
    });

    it('rejects duplicates, invalid names and unborn start points', () => {
      const bench = setup();
      bench.run(branch, { action: 'create', name: 'feature' });

      expect(bench.run(branch, { action: 'create', name: 'feature' }).output).toBe(
        "fatal: a branch named 'feature' already exists",
      );
      expect(bench.run(branch, { action: 'create', name: 'bad..name' }).output).toBe(
        "fatal: 'bad..name' is not a valid branch name",
      );
      expect(bench.run(branch, { action: 'create', name: 'x', startPoint: 'nope' }).output).toBe(
        "fatal: not a valid object name: 'nope'",
      );
      expect(new GitTestBench().init().run(branch, { action: 'create', name: 'x' }).output).toBe(
        "fatal: not a valid object name: 'main'",
      );
    });

    it('moves an existing branch with --force, except the current one', () => {
      const bench = setup();
      const first = bench.headCommit.hash;
      bench.run(branch, { action: 'create', name: 'feature' });
      bench.commit('feat: add b', { 'b.txt': 'b' });
      bench.run(branch, { action: 'create', name: 'feature', force: true });

      expect(bench.repository.branches.feature).not.toBe(first);
      expect(
        bench.run(branch, { action: 'create', name: 'main', startPoint: first, force: true })
          .exitCode,
      ).toBe(128);
    });
  });

  describe('delete', () => {
    it('deletes a merged branch', () => {
      const bench = setup();
      const hash = shortHash(bench.headCommit.hash);
      bench.run(branch, { action: 'create', name: 'feature' });
      const result = bench.run(branch, { action: 'delete', names: ['feature'] });

      expect(result.output).toBe(`Deleted branch feature (was ${hash}).`);
      expect(bench.repository.branches.feature).toBeUndefined();
    });

    it('protects unmerged work unless forced', () => {
      const bench = setup();
      const checkout = new CheckoutCommand(bench.context);
      bench.run(checkout, { targets: [], newBranch: 'feature' });
      bench.commit('feat: add b', { 'b.txt': 'b' });
      bench.run(checkout, { targets: ['main'] });

      const refused = bench.run(branch, { action: 'delete', names: ['feature'] });
      expect(refused.exitCode).toBe(1);
      expect(refused.output).toBe(
        [
          "error: the branch 'feature' is not fully merged",
          "hint: If you are sure you want to delete it, run 'git branch -D feature'",
        ].join('\n'),
      );

      expect(
        bench.run(branch, { action: 'delete', names: ['feature'], force: true }).exitCode,
      ).toBe(0);
    });

    it('refuses to delete the current branch and reports missing ones', () => {
      const bench = setup();
      bench.run(branch, { action: 'create', name: 'feature' });
      const result = bench.run(branch, { action: 'delete', names: ['main', 'nope', 'feature'] });

      expect(result.exitCode).toBe(1);
      expect(result.output.split('\n')).toEqual([
        "error: cannot delete branch 'main' used by worktree at '/home/alice/project'",
        "error: branch 'nope' not found",
        expect.stringMatching(/^Deleted branch feature/),
      ]);
      expect(result.explanation.key).toBe('error.cannotDeleteCurrentBranch');
      expect(Object.keys(bench.repository.branches)).toEqual(['main']);
    });
  });

  describe('rename', () => {
    it('renames the current branch and keeps HEAD on it', () => {
      const bench = setup();
      bench.run(branch, { action: 'rename', newName: 'trunk' });

      expect(Object.keys(bench.repository.branches)).toEqual(['trunk']);
      expect(bench.repository.head).toEqual({ type: 'attached', branch: 'trunk' });
    });

    it('renames an unborn current branch', () => {
      const bench = new GitTestBench().init();
      bench.run(branch, { action: 'rename', newName: 'trunk' });

      expect(bench.repository.head).toEqual({ type: 'attached', branch: 'trunk' });
    });

    it('renames another branch and refuses to overwrite', () => {
      const bench = setup();
      bench.run(branch, { action: 'create', name: 'a' });
      bench.run(branch, { action: 'create', name: 'b' });
      bench.run(branch, { action: 'rename', oldName: 'a', newName: 'c' });

      expect(Object.keys(bench.repository.branches).sort()).toEqual(['b', 'c', 'main']);
      expect(bench.run(branch, { action: 'rename', oldName: 'c', newName: 'b' }).exitCode).toBe(
        128,
      );
      expect(bench.run(branch, { action: 'rename', oldName: 'x', newName: 'y' }).output).toBe(
        "fatal: no branch named 'x'",
      );
    });
  });
});
