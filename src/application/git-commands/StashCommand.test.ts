import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { AddCommand } from './AddCommand';
import { StashCommand } from './StashCommand';

function setup() {
  const bench = new GitTestBench().init();
  bench.commit('feat: base', { 'app.txt': 'base\n' });
  return { bench, stash: new StashCommand(bench.context) };
}

describe('StashCommand', () => {
  it('sets work aside and restores a clean working tree', () => {
    const { bench, stash } = setup();
    bench.write({ 'app.txt': 'work in progress\n', 'new.txt': 'new\n' });
    bench.run(new AddCommand(bench.context), { pathspecs: ['new.txt'] });
    const result = bench.run(stash, { action: 'push' });

    expect(result.output).toMatch(
      /^Saved working directory and index state WIP on main: [0-9a-f]{7} feat: base$/,
    );
    expect(bench.workspace.files).toEqual({ 'app.txt': 'base\n' });
    expect(bench.run(stash, { action: 'list' }).output).toMatch(/^stash@\{0\}: WIP on main: /);
  });

  it('brings the work back with pop, restaging new files', () => {
    const { bench, stash } = setup();
    bench.write({ 'app.txt': 'work in progress\n', 'new.txt': 'new\n' });
    bench.run(new AddCommand(bench.context), { pathspecs: ['new.txt'] });
    bench.run(stash, { action: 'push', message: 'half-done login' });
    const result = bench.run(stash, { action: 'pop' });

    expect(bench.workspace.files).toEqual({ 'app.txt': 'work in progress\n', 'new.txt': 'new\n' });
    expect(Object.keys(bench.repository.index).sort()).toEqual(['app.txt', 'new.txt']);
    expect(result.output).toMatch(/modified: {3}app\.txt/);
    expect(result.output).toMatch(/Dropped refs\/stash@\{0\} \([0-9a-f]{40}\)$/);
    expect(bench.repository.stash).toEqual([]);
  });

  it('keeps untracked files unless -u is given', () => {
    const { bench, stash } = setup();
    bench.write({ 'scratch.txt': 'notes\n' });

    expect(bench.run(stash, { action: 'push' }).output).toBe('No local changes to save');
    bench.run(stash, { action: 'push', includeUntracked: true });
    expect(bench.workspace.files['scratch.txt']).toBeUndefined();
    bench.run(stash, { action: 'apply' });
    expect(bench.workspace.files['scratch.txt']).toBe('notes\n');
    expect(bench.repository.stash).toHaveLength(1);
  });

  it('keeps the entry when popping causes a conflict', () => {
    const { bench, stash } = setup();
    bench.write({ 'app.txt': 'stashed\n' });
    bench.run(stash, { action: 'push' });
    bench.commit('feat: meanwhile', { 'app.txt': 'committed\n' });
    const result = bench.run(stash, { action: 'pop' });

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('The stash entry is kept in case you need it again.');
    expect(bench.workspace.files['app.txt']).toContain('<<<<<<< Updated upstream');
    expect(bench.repository.stash).toHaveLength(1);
  });

  it('drops entries and reports invalid references', () => {
    const { bench, stash } = setup();
    expect(bench.run(stash, { action: 'pop' }).output).toBe('No stash entries found.');

    bench.write({ 'app.txt': 'x\n' });
    bench.run(stash, { action: 'push' });
    expect(bench.run(stash, { action: 'drop', reference: 'stash@{3}' }).output).toBe(
      'error: stash@{3} is not a valid reference',
    );
    expect(bench.run(stash, { action: 'drop' }).output).toMatch(/^Dropped refs\/stash@\{0\}/);
  });
});
