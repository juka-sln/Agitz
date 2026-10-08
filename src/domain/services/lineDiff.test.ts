import { countLineChanges, diffLines, splitLines } from './lineDiff';

describe('splitLines', () => {
  it('ignores the final newline', () => {
    expect(splitLines('a\nb\n')).toEqual(['a', 'b']);
    expect(splitLines('')).toEqual([]);
  });
});

describe('diffLines', () => {
  it('keeps common lines as context and reports changes', () => {
    expect(diffLines('a\nb\nc\n', 'a\nB\nc\nd\n')).toEqual([
      { type: 'context', line: 'a' },
      { type: 'removed', line: 'b' },
      { type: 'added', line: 'B' },
      { type: 'context', line: 'c' },
      { type: 'added', line: 'd' },
    ]);
  });

  it('handles an empty side', () => {
    expect(diffLines('', 'x\n')).toEqual([{ type: 'added', line: 'x' }]);
    expect(diffLines('x\n', '')).toEqual([{ type: 'removed', line: 'x' }]);
  });
});

describe('countLineChanges', () => {
  it('counts insertions and deletions', () => {
    expect(countLineChanges('one\ntwo\nthree\n', 'one\n2\nthree\nfour\n')).toEqual({
      insertions: 2,
      deletions: 1,
    });
  });
});
