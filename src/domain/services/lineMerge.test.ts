import { mergeLines } from './lineMerge';

const labels = { ours: 'HEAD', theirs: 'feature' };
const lines = (...values: string[]) => `${values.join('\n')}\n`;

describe('mergeLines', () => {
  const base = lines('one', 'two', 'three', 'four', 'five');

  it('combines changes made to different parts of the file', () => {
    const ours = lines('ONE', 'two', 'three', 'four', 'five');
    const theirs = lines('one', 'two', 'three', 'four', 'FIVE', 'six');

    expect(mergeLines(base, ours, theirs, labels)).toEqual({
      content: lines('ONE', 'two', 'three', 'four', 'FIVE', 'six'),
      conflicted: false,
    });
  });

  it('keeps an identical change made on both sides once', () => {
    const both = lines('one', 'TWO', 'three', 'four', 'five');

    expect(mergeLines(base, both, both, labels)).toEqual({ content: both, conflicted: false });
  });

  it('wraps a change to the same line in conflict markers', () => {
    const ours = lines('one', 'two', 'mine', 'four', 'five');
    const theirs = lines('one', 'two', 'yours', 'four', 'five');

    expect(mergeLines(base, ours, theirs, labels)).toEqual({
      content: lines(
        'one',
        'two',
        '<<<<<<< HEAD',
        'mine',
        '=======',
        'yours',
        '>>>>>>> feature',
        'four',
        'five',
      ),
      conflicted: true,
    });
  });

  it('treats changes to adjacent lines as a conflict, like Git', () => {
    const ours = lines('one', 'TWO', 'three', 'four', 'five');
    const theirs = lines('one', 'two', 'THREE', 'four', 'five');

    expect(mergeLines(base, ours, theirs, labels).conflicted).toBe(true);
  });

  it('merges files added on both sides from an empty base', () => {
    const result = mergeLines('', lines('a'), lines('b'), labels);

    expect(result.conflicted).toBe(true);
    expect(result.content).toBe(lines('<<<<<<< HEAD', 'a', '=======', 'b', '>>>>>>> feature'));
  });

  it('keeps one side untouched when only the other changed', () => {
    const theirs = lines('one', 'two', 'three', 'four');

    expect(mergeLines(base, base, theirs, labels)).toEqual({ content: theirs, conflicted: false });
  });
});
