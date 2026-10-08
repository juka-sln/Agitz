import { shortHash } from '@/domain/value-objects/Hash';
import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { LogCommand } from './LogCommand';
import { TagCommand } from './TagCommand';

function setup() {
  const bench = new GitTestBench().init();
  bench.commit('feat: first', { 'a.txt': 'a' });
  bench.commit('feat: second', { 'b.txt': 'b' });
  return { bench, tag: new TagCommand(bench.context) };
}

describe('TagCommand', () => {
  it('creates a lightweight tag on HEAD and lists tags', () => {
    const { bench, tag } = setup();
    bench.run(tag, { action: 'create', name: 'v1.1.0' });
    bench.run(tag, { action: 'create', name: 'v1.0.0', target: 'HEAD~1' });

    expect(bench.repository.tags['v1.1.0']).toEqual({
      target: bench.headCommit.hash,
      annotation: null,
    });
    expect(bench.run(tag, { action: 'list' }).output).toBe('v1.0.0\nv1.1.0');
    expect(bench.run(tag, { action: 'list', pattern: 'v1.0*' }).output).toBe('v1.0.0');
  });

  it('records who created an annotated tag and why', () => {
    const { bench, tag } = setup();
    const result = bench.run(tag, { action: 'create', name: 'v2.0.0', message: 'Release 2.0.0' });

    expect(result.explanation.key).toBe('tag.createdAnnotated');
    expect(bench.repository.tags['v2.0.0']?.annotation).toMatchObject({
      message: 'Release 2.0.0',
      tagger: { name: 'Alice' },
    });
    expect(bench.run(tag, { action: 'create', name: 'v3', annotated: true }).output).toBe(
      'fatal: no tag message?',
    );
  });

  it('shows tags in git log decorations', () => {
    const { bench, tag } = setup();
    bench.run(tag, { action: 'create', name: 'v1.0.0' });

    expect(bench.run(new LogCommand(), { oneline: true, maxCount: 1 }).output).toMatch(
      /^[0-9a-f]{7} \(HEAD -> main, tag: v1\.0\.0\) feat: second$/,
    );
  });

  it('refuses duplicates and invalid names, and deletes tags', () => {
    const { bench, tag } = setup();
    bench.run(tag, { action: 'create', name: 'v1' });

    expect(bench.run(tag, { action: 'create', name: 'v1' }).output).toBe(
      "fatal: tag 'v1' already exists",
    );
    expect(bench.run(tag, { action: 'create', name: 'bad name' }).output).toBe(
      "fatal: 'bad name' is not a valid tag name.",
    );
    expect(bench.run(tag, { action: 'delete', names: ['v1'] }).output).toBe(
      `Deleted tag 'v1' (was ${shortHash(bench.headCommit.hash)})`,
    );
    expect(bench.run(tag, { action: 'delete', names: ['v1'] })).toMatchObject({
      output: "error: tag 'v1' not found.",
      exitCode: 1,
    });
  });
});
