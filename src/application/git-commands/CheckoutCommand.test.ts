import { shortHash } from '@/domain/value-objects/Hash';
import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { AddCommand } from './AddCommand';
import { CheckoutCommand } from './CheckoutCommand';

/** main: README + app (v1). feature: app (v2) + feature.txt, one commit ahead. */
function setup() {
  const bench = new GitTestBench().init();
  bench.commit('feat: add app', { 'README.md': 'readme\n', 'app.txt': 'v1\n' });
  const checkout = new CheckoutCommand(bench.context);
  bench.run(checkout, { targets: [], newBranch: 'feature' });
  bench.commit('feat: improve app', { 'app.txt': 'v2\n', 'feature.txt': 'feature\n' });
  bench.run(checkout, { targets: ['main'] });
  return { bench, checkout };
}

describe('CheckoutCommand', () => {
  describe('switching branches', () => {
    it('updates HEAD, the index and the working tree', () => {
      const { bench, checkout } = setup();
      const result = bench.run(checkout, { targets: ['feature'] });

      expect(result.output).toBe("Switched to branch 'feature'");
      expect(result.diffState.headChanged).toBe(true);
      expect(bench.repository.head).toEqual({ type: 'attached', branch: 'feature' });
      expect(bench.workspace.files).toEqual({
        'README.md': 'readme\n',
        'app.txt': 'v2\n',
        'feature.txt': 'feature\n',
      });
      expect(bench.repository.index).toEqual(bench.headCommit.tree);
    });

    it('says when already on the branch', () => {
      const { bench, checkout } = setup();
      expect(bench.run(checkout, { targets: ['main'] }).output).toBe("Already on 'main'");
    });

    it('carries local changes that do not conflict', () => {
      const { bench, checkout } = setup();
      bench.write({ 'README.md': 'edited\n' });
      const result = bench.run(checkout, { targets: ['feature'] });

      expect(result.output).toBe("M\tREADME.md\nSwitched to branch 'feature'");
      expect(bench.workspace.files['README.md']).toBe('edited\n');
    });

    it('refuses to overwrite local changes', () => {
      const { bench, checkout } = setup();
      bench.write({ 'app.txt': 'local\n' });
      const result = bench.run(checkout, { targets: ['feature'] });

      expect(result.exitCode).toBe(1);
      expect(result.output).toBe(
        [
          'error: Your local changes to the following files would be overwritten by checkout:',
          '\tapp.txt',
          'Please commit your changes or stash them before you switch branches.',
          'Aborting',
        ].join('\n'),
      );
      expect(bench.repository.head).toEqual({ type: 'attached', branch: 'main' });
    });
  });

  describe('creating branches', () => {
    it('creates and switches with -b', () => {
      const { bench, checkout } = setup();
      const result = bench.run(checkout, { targets: [], newBranch: 'fix/typo' });

      expect(result.output).toBe("Switched to a new branch 'fix/typo'");
      expect(bench.repository.branches['fix/typo']).toBe(bench.repository.branches.main);
    });

    it('creates a branch from a start point', () => {
      const { bench, checkout } = setup();
      bench.run(checkout, { targets: ['feature'], newBranch: 'copy' });

      expect(bench.repository.branches.copy).toBe(bench.repository.branches.feature);
      expect(bench.workspace.files['feature.txt']).toBe('feature\n');
    });

    it('switches to an unborn branch in an empty repository', () => {
      const bench = new GitTestBench().init();
      const result = bench.run(new CheckoutCommand(bench.context), {
        targets: [],
        newBranch: 'dev',
      });

      expect(result.output).toBe("Switched to a new branch 'dev'");
      expect(bench.repository.head).toEqual({ type: 'attached', branch: 'dev' });
    });

    it('rejects existing branches and invalid start points', () => {
      const { bench, checkout } = setup();

      expect(bench.run(checkout, { targets: [], newBranch: 'feature' }).output).toBe(
        "fatal: a branch named 'feature' already exists",
      );
      expect(bench.run(checkout, { targets: ['nope'], newBranch: 'x' }).output).toBe(
        "fatal: 'nope' is not a commit and a branch 'x' cannot be created from it",
      );
    });
  });

  describe('detached HEAD', () => {
    it('detaches HEAD on a commit and explains the state', () => {
      const { bench, checkout } = setup();
      const main = bench.headCommit;
      const result = bench.run(checkout, { targets: [shortHash(main.hash)] });

      expect(bench.repository.head).toEqual({ type: 'detached', commit: main.hash });
      expect(result.output).toMatch(new RegExp(`^Note: switching to '${shortHash(main.hash)}'\\.`));
      expect(result.output).toContain("You are in 'detached HEAD' state.");
      expect(result.output).toMatch(
        new RegExp(`HEAD is now at ${shortHash(main.hash)} feat: add app$`),
      );
      expect(result.explanation.key).toBe('checkout.detached');
    });

    it('mentions the previous position when leaving without losing commits', () => {
      const { bench, checkout } = setup();
      bench.run(checkout, { targets: ['feature^0'] });
      const detachedAt = bench.headCommit;

      expect(bench.run(checkout, { targets: ['main'] }).output).toBe(
        `Previous HEAD position was ${shortHash(detachedAt.hash)} feat: improve app\nSwitched to branch 'main'`,
      );
    });

    it('prints nothing about HEAD when switching to the same commit', () => {
      const { bench, checkout } = setup();
      bench.run(checkout, { targets: ['feature~1'] });

      expect(bench.run(checkout, { targets: ['main'] }).output).toBe("Switched to branch 'main'");
    });

    it('warns when commits made in detached HEAD are left behind', () => {
      const { bench, checkout } = setup();
      bench.run(checkout, { targets: ['HEAD'], detach: true });
      bench.commit('test: experiment', { 'lab.txt': 'lab\n' });
      const orphan = bench.headCommit;
      const result = bench.run(checkout, { targets: ['main'] });

      expect(result.output).toBe(
        [
          'Warning: you are leaving 1 commit behind, not connected to',
          'any of your branches:',
          '',
          `  ${shortHash(orphan.hash)} test: experiment`,
          '',
          'If you want to keep it by creating a new branch, this may be a good time',
          'to do so with:',
          '',
          ` git branch <new-branch-name> ${shortHash(orphan.hash)}`,
          '',
          "Switched to branch 'main'",
        ].join('\n'),
      );
      expect(result.explanation.params.leftBehind).toBe(1);
    });
  });

  describe('restoring paths', () => {
    it('discards working tree changes from the index', () => {
      const { bench, checkout } = setup();
      bench.write({ 'app.txt': 'broken\n' });

      expect(bench.run(checkout, { targets: [], paths: ['app.txt'] }).output).toBe(
        'Updated 1 path from the index',
      );
      expect(bench.workspace.files['app.txt']).toBe('v1\n');
    });

    it('treats an argument that is not a revision as a path', () => {
      const { bench, checkout } = setup();
      bench.write({ 'app.txt': 'broken\n' });
      bench.run(checkout, { targets: ['app.txt'] });

      expect(bench.workspace.files['app.txt']).toBe('v1\n');
    });

    it('restores files from a commit into the index and working tree', () => {
      const { bench, checkout } = setup();
      const result = bench.run(checkout, { targets: ['feature'], paths: ['app.txt'] });

      expect(result.output).toMatch(/^Updated 1 path from [0-9a-f]{7}$/);
      expect(bench.workspace.files['app.txt']).toBe('v2\n');
      expect(bench.repository.head).toEqual({ type: 'attached', branch: 'main' });
      bench.run(new AddCommand(bench.context), { pathspecs: ['.'] });
      expect(bench.repository.index['app.txt']).toBe(
        bench.repository.commits[bench.repository.branches.feature ?? '']?.tree['app.txt'],
      );
    });

    it('fails on unknown paths and references', () => {
      const { bench, checkout } = setup();

      expect(bench.run(checkout, { targets: ['nope'] }).output).toBe(
        "error: pathspec 'nope' did not match any file(s) known to git",
      );
      expect(bench.run(checkout, { targets: ['nope'], paths: ['app.txt'] }).output).toBe(
        'fatal: invalid reference: nope',
      );
    });
  });
});
