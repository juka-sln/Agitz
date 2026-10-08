import { toHash, type Hash } from '@/domain/value-objects/Hash';
import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { LogCommand } from './LogCommand';

function createdHash(result: { diffState: { createdCommits: readonly Hash[] } }): Hash {
  return toHash(result.diffState.createdCommits[0] ?? '');
}

describe('LogCommand', () => {
  const log = new LogCommand();

  it('fails on an unborn branch', () => {
    const result = new GitTestBench().init().run(log, {});

    expect(result.exitCode).toBe(128);
    expect(result.output).toBe("fatal: your current branch 'main' does not have any commits yet");
  });

  it('prints the full history newest first with decorations', () => {
    const bench = new GitTestBench().init();
    const first = createdHash(bench.commit('feat: add a', { 'a.txt': 'a' }));
    const second = createdHash(bench.commit('feat: add b\n\nWith a body.', { 'b.txt': 'b' }));

    expect(bench.run(log, {}).output).toBe(
      [
        `commit ${second} (HEAD -> main)`,
        'Author: Alice <alice@example.com>',
        'Date:   Thu Jan 15 10:01:00 2026 +0100',
        '',
        '    feat: add b',
        '',
        '    With a body.',
        '',
        `commit ${first}`,
        'Author: Alice <alice@example.com>',
        'Date:   Thu Jan 15 10:00:00 2026 +0100',
        '',
        '    feat: add a',
      ].join('\n'),
    );
  });

  it('supports --oneline, a maximum count and explicit revisions', () => {
    const bench = new GitTestBench().init();
    const first = createdHash(bench.commit('feat: add a', { 'a.txt': 'a' }));
    const second = createdHash(bench.commit('feat: add b', { 'b.txt': 'b' }));
    const short = (hash: Hash) => hash.slice(0, 7);

    expect(bench.run(log, { oneline: true }).output).toBe(
      `${short(second)} (HEAD -> main) feat: add b\n${short(first)} feat: add a`,
    );
    expect(bench.run(log, { oneline: true, maxCount: 1 }).output).toBe(
      `${short(second)} (HEAD -> main) feat: add b`,
    );
    expect(bench.run(log, { oneline: true, revisions: ['HEAD~1'] }).output).toBe(
      `${short(first)} feat: add a`,
    );
  });

  it('reports unknown revisions like Git', () => {
    const bench = new GitTestBench().init();
    bench.commit('feat: add a', { 'a.txt': 'a' });

    expect(bench.run(log, { revisions: ['nope'] }).output).toMatch(
      /^fatal: ambiguous argument 'nope': unknown revision/,
    );
  });
});
