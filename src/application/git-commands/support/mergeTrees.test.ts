import { GitTestBench } from '@/test/fixtures/GitTestBench';

import { applyMergeResult, mergeTrees } from './mergeTrees';

const labels = { ours: 'HEAD', theirs: 'feature' };

/** Builds three snapshots from file maps by committing them in sequence. */
function snapshots(
  base: Record<string, string>,
  ours: Record<string, string>,
  theirs: Record<string, string>,
) {
  const bench = new GitTestBench().init();
  const tree = (files: Record<string, string>) => {
    Object.keys(bench.workspace.files).forEach((path) => bench.remove(path));
    bench.commit(`snapshot ${JSON.stringify(files)}`, files);
    return bench.headCommit.tree;
  };
  const trees = { base: tree(base), theirs: tree(theirs), ours: tree(ours) };
  return { bench, trees };
}

describe('mergeTrees', () => {
  it('takes each side when only that side changed a file', () => {
    const { bench, trees } = snapshots(
      { 'a.txt': 'a\n', 'b.txt': 'b\n', 'gone.txt': 'x\n' },
      { 'a.txt': 'A\n', 'b.txt': 'b\n', 'gone.txt': 'x\n' },
      { 'a.txt': 'a\n', 'b.txt': 'B\n', 'new.txt': 'n\n' },
    );
    const result = mergeTrees(bench.context.hasher, bench.repository, trees, labels);

    expect(result.conflicts).toEqual({});
    expect(Object.keys(result.tree).sort()).toEqual(['a.txt', 'b.txt', 'new.txt']);
    expect(result.files).toEqual({ 'b.txt': 'B\n', 'gone.txt': null, 'new.txt': 'n\n' });
    expect(result.messages).toEqual([]);
  });

  it('merges non-overlapping edits of the same file', () => {
    const { bench, trees } = snapshots(
      { 'f.txt': '1\n2\n3\n4\n' },
      { 'f.txt': 'one\n2\n3\n4\n' },
      { 'f.txt': '1\n2\n3\nfour\n' },
    );
    const result = mergeTrees(bench.context.hasher, bench.repository, trees, labels);

    expect(result.files['f.txt']).toBe('one\n2\n3\nfour\n');
    expect(result.messages).toEqual(['Auto-merging f.txt']);
    expect(result.repository.blobs[result.tree['f.txt'] ?? '']).toBe('one\n2\n3\nfour\n');
  });

  it('reports content and modify/delete conflicts', () => {
    const { bench, trees } = snapshots(
      { 'f.txt': 'x\n', 'd.txt': 'd\n' },
      { 'f.txt': 'ours\n', 'd.txt': 'changed\n' },
      { 'f.txt': 'theirs\n' },
    );
    const result = mergeTrees(bench.context.hasher, bench.repository, trees, labels);

    expect(Object.keys(result.conflicts).sort()).toEqual(['d.txt', 'f.txt']);
    expect(result.tree['f.txt']).toBeUndefined();
    expect(result.files['f.txt']).toBe('<<<<<<< HEAD\nours\n=======\ntheirs\n>>>>>>> feature\n');
    expect(result.messages).toEqual([
      'CONFLICT (modify/delete): d.txt deleted in feature and modified in HEAD.  Version HEAD of d.txt left in tree.',
      'Auto-merging f.txt',
      'CONFLICT (content): Merge conflict in f.txt',
    ]);
  });
});

describe('applyMergeResult', () => {
  it('writes merged files and records conflicts', () => {
    const { bench, trees } = snapshots(
      { 'f.txt': 'x\n' },
      { 'f.txt': 'ours\n' },
      { 'f.txt': 'theirs\n' },
    );
    const result = mergeTrees(bench.context.hasher, bench.repository, trees, labels);
    const applied = applyMergeResult(bench.repository, bench.workspace.files, result, 'merge');

    expect(applied.files['f.txt']).toContain('<<<<<<< HEAD');
    expect(Object.keys(applied.repository.unmerged)).toEqual(['f.txt']);
    expect(applied.repository.index['f.txt']).toBeUndefined();
  });

  it('refuses to overwrite local changes', () => {
    const { bench, trees } = snapshots(
      { 'f.txt': 'x\n' },
      { 'f.txt': 'x\n' },
      { 'f.txt': 'theirs\n' },
    );
    bench.write({ 'f.txt': 'local edit\n' });
    const result = mergeTrees(bench.context.hasher, bench.repository, trees, labels);

    expect(() =>
      applyMergeResult(bench.repository, bench.workspace.files, result, 'merge'),
    ).toThrow('Please commit your changes or stash them before you merge.');
  });
});
