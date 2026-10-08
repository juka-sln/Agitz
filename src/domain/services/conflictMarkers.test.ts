import {
  countConflicts,
  parseConflictedFile,
  renderConflictedFile,
  resolveConflict,
} from './conflictMarkers';
import { mergeLines } from './lineMerge';

const lines = (...values: string[]) => `${values.join('\n')}\n`;

const conflicted = lines(
  '# Project',
  '<<<<<<< HEAD',
  'Welcome to the shop',
  '=======',
  'Welcome to our store',
  '>>>>>>> feature/title',
  'Opening hours',
);

describe('parseConflictedFile', () => {
  it('separates plain text from conflicts', () => {
    expect(parseConflictedFile(conflicted)).toEqual({
      blocks: [
        { kind: 'text', lines: ['# Project'] },
        {
          kind: 'conflict',
          oursLabel: 'HEAD',
          theirsLabel: 'feature/title',
          ours: ['Welcome to the shop'],
          base: null,
          theirs: ['Welcome to our store'],
        },
        { kind: 'text', lines: ['Opening hours'] },
      ],
      endsWithNewline: true,
    });
  });

  it('reads the common ancestor of the diff3 style', () => {
    const file = parseConflictedFile(
      lines('<<<<<<< HEAD', 'mine', '||||||| base', 'old', '=======', 'theirs', '>>>>>>> topic'),
    );

    expect(file.blocks).toEqual([
      {
        kind: 'conflict',
        oursLabel: 'HEAD',
        theirsLabel: 'topic',
        ours: ['mine'],
        base: ['old'],
        theirs: ['theirs'],
      },
    ]);
  });

  it('keeps incomplete markers as plain text', () => {
    const file = parseConflictedFile(lines('<<<<<<< HEAD', 'mine', '=======', 'theirs'));

    expect(countConflicts(file)).toBe(0);
    expect(renderConflictedFile(file)).toBe(lines('<<<<<<< HEAD', 'mine', '=======', 'theirs'));
  });

  it('finds every conflict written by a three-way merge', () => {
    const base = lines('a', 'b', 'c', 'd', 'e');
    const { content } = mergeLines(
      base,
      lines('A', 'b', 'c', 'd', 'E'),
      lines('a1', 'b', 'c', 'd', 'e1'),
      { ours: 'HEAD', theirs: 'topic' },
    );

    const file = parseConflictedFile(content);

    expect(countConflicts(file)).toBe(2);
    expect(renderConflictedFile(file)).toBe(content);
  });
});

describe('resolveConflict', () => {
  it('keeps our side', () => {
    expect(resolveConflict(conflicted, 0, 'ours')).toBe(
      lines('# Project', 'Welcome to the shop', 'Opening hours'),
    );
  });

  it('keeps their side', () => {
    expect(resolveConflict(conflicted, 0, 'theirs')).toBe(
      lines('# Project', 'Welcome to our store', 'Opening hours'),
    );
  });

  it('keeps both sides, ours first', () => {
    expect(resolveConflict(conflicted, 0, 'both')).toBe(
      lines('# Project', 'Welcome to the shop', 'Welcome to our store', 'Opening hours'),
    );
  });

  it('only touches the chosen conflict', () => {
    const twice = `${conflicted}${conflicted}`;

    const resolved = resolveConflict(twice, 1, 'theirs');

    expect(countConflicts(parseConflictedFile(resolved))).toBe(1);
    expect(resolved.endsWith(lines('Welcome to our store', 'Opening hours'))).toBe(true);
  });

  it('preserves a missing final newline', () => {
    expect(resolveConflict(conflicted.slice(0, -1), 0, 'ours')).toBe(
      '# Project\nWelcome to the shop\nOpening hours',
    );
  });
});
