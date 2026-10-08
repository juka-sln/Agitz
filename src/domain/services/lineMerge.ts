import { diffLineArrays, splitLines } from './lineDiff';

export interface MergeLabels {
  readonly ours: string;
  readonly theirs: string;
}

export interface LineMergeResult {
  readonly content: string;
  readonly conflicted: boolean;
}

/** Replaces `base[baseStart, baseEnd)` with `lines`. */
interface Hunk {
  readonly side: 'ours' | 'theirs';
  readonly baseStart: number;
  readonly baseEnd: number;
  readonly lines: readonly string[];
}

function computeHunks(
  base: readonly string[],
  other: readonly string[],
  side: Hunk['side'],
): Hunk[] {
  const hunks: Hunk[] = [];
  let baseIndex = 0;
  let current: { baseStart: number; baseEnd: number; lines: string[] } | null = null;

  for (const operation of diffLineArrays(base, other)) {
    if (operation.type === 'context') {
      if (current) {
        hunks.push({ side, ...current });
        current = null;
      }
      baseIndex += 1;
      continue;
    }
    current ??= { baseStart: baseIndex, baseEnd: baseIndex, lines: [] };
    if (operation.type === 'removed') {
      baseIndex += 1;
      current.baseEnd = baseIndex;
    } else {
      current.lines.push(operation.line);
    }
  }
  if (current) {
    hunks.push({ side, ...current });
  }
  return hunks;
}

function applyHunks(base: readonly string[], start: number, end: number, hunks: readonly Hunk[]) {
  const lines: string[] = [];
  let position = start;
  for (const hunk of hunks) {
    lines.push(...base.slice(position, hunk.baseStart), ...hunk.lines);
    position = hunk.baseEnd;
  }
  lines.push(...base.slice(position, end));
  return lines;
}

const sameLines = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((line, index) => line === right[index]);

/**
 * Three-way merge of text files (diff3): changes made on only one side are kept,
 * identical changes on both sides are kept once, and overlapping or adjacent
 * changes become a conflict wrapped in Git's `<<<<<<<` / `=======` / `>>>>>>>` markers.
 */
export function mergeLines(
  baseContent: string,
  oursContent: string,
  theirsContent: string,
  labels: MergeLabels,
): LineMergeResult {
  const base = splitLines(baseContent);
  const hunks = [
    ...computeHunks(base, splitLines(oursContent), 'ours'),
    ...computeHunks(base, splitLines(theirsContent), 'theirs'),
  ].sort((left, right) => left.baseStart - right.baseStart || left.baseEnd - right.baseEnd);

  const merged: string[] = [];
  let conflicted = false;
  let cursor = 0;
  let index = 0;

  for (let first = hunks[index]; first !== undefined; first = hunks[index]) {
    const group = [first];
    let end = first.baseEnd;
    index += 1;
    for (
      let next = hunks[index];
      next !== undefined && next.baseStart <= end;
      next = hunks[index]
    ) {
      group.push(next);
      end = Math.max(end, next.baseEnd);
      index += 1;
    }

    const start = first.baseStart;
    merged.push(...base.slice(cursor, start));
    const ours = applyHunks(
      base,
      start,
      end,
      group.filter((hunk) => hunk.side === 'ours'),
    );
    const theirs = applyHunks(
      base,
      start,
      end,
      group.filter((hunk) => hunk.side === 'theirs'),
    );
    const sides = new Set(group.map((hunk) => hunk.side));

    if (sides.size === 1) {
      merged.push(...(sides.has('ours') ? ours : theirs));
    } else if (sameLines(ours, theirs)) {
      merged.push(...ours);
    } else {
      conflicted = true;
      merged.push(
        `<<<<<<< ${labels.ours}`,
        ...ours,
        '=======',
        ...theirs,
        `>>>>>>> ${labels.theirs}`,
      );
    }
    cursor = end;
  }
  merged.push(...base.slice(cursor));

  const endsWithNewline = [oursContent, theirsContent, baseContent].some((content) =>
    content.endsWith('\n'),
  );
  const content = merged.join('\n');
  return { content: merged.length > 0 && endsWithNewline ? `${content}\n` : content, conflicted };
}

const CONFLICT_MARKER_LINE = /^(?:<{7}|>{7})(?: |$)/m;

/** Whether a file still holds the markers of an unresolved conflict. */
export function containsConflictMarkers(content: string): boolean {
  return CONFLICT_MARKER_LINE.test(content);
}
