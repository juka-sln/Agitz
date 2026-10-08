import { splitLines } from './lineDiff';

/** A conflict as Git writes it in a file: both versions of the lines, between markers. */
export interface ConflictBlock {
  readonly kind: 'conflict';
  /** The text after `<<<<<<<`, usually `HEAD`. */
  readonly oursLabel: string;
  /** The text after `>>>>>>>`: the branch or commit being brought in. */
  readonly theirsLabel: string;
  readonly ours: readonly string[];
  /** The common ancestor, only present in the `diff3` style (`|||||||` section). */
  readonly base: readonly string[] | null;
  readonly theirs: readonly string[];
}

export interface TextBlock {
  readonly kind: 'text';
  readonly lines: readonly string[];
}

export type ConflictedFileBlock = TextBlock | ConflictBlock;

export interface ConflictedFile {
  readonly blocks: readonly ConflictedFileBlock[];
  readonly endsWithNewline: boolean;
}

/** How to settle one conflict: keep one side, or both one after the other. */
export type ConflictChoice = 'ours' | 'theirs' | 'both';

const OPENING = /^<{7}(?: (.*))?$/;
const BASE = /^\|{7}(?: .*)?$/;
const SEPARATOR = /^={7}$/;
const CLOSING = /^>{7}(?: (.*))?$/;

/**
 * Splits a file into plain text and conflicts. A conflict whose markers are incomplete
 * (for instance because they were partly edited by hand) stays plain text, like for Git.
 */
export function parseConflictedFile(content: string): ConflictedFile {
  const lines = splitLines(content);
  const blocks: ConflictedFileBlock[] = [];
  let text: string[] = [];

  const flushText = () => {
    if (text.length > 0) {
      blocks.push({ kind: 'text', lines: text });
      text = [];
    }
  };

  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? '';
    const opening = OPENING.exec(line);
    const block = opening ? readConflict(lines, index, opening[1] ?? '') : null;
    if (block === null) {
      text.push(line);
      index += 1;
      continue;
    }
    flushText();
    blocks.push(block.conflict);
    index = block.next;
  }
  flushText();

  return { blocks, endsWithNewline: content.endsWith('\n') };
}

function readConflict(
  lines: readonly string[],
  start: number,
  oursLabel: string,
): { conflict: ConflictBlock; next: number } | null {
  const ours: string[] = [];
  let base: string[] | null = null;
  const theirs: string[] = [];
  let section: 'ours' | 'base' | 'theirs' = 'ours';

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (OPENING.test(line)) {
      return null;
    }
    if (section === 'ours' && BASE.test(line)) {
      section = 'base';
      base = [];
    } else if (section !== 'theirs' && SEPARATOR.test(line)) {
      section = 'theirs';
    } else if (section === 'theirs' && CLOSING.test(line)) {
      const theirsLabel = CLOSING.exec(line)?.[1] ?? '';
      return {
        conflict: { kind: 'conflict', oursLabel, theirsLabel, ours, base, theirs },
        next: index + 1,
      };
    } else if (section === 'ours') {
      ours.push(line);
    } else if (section === 'base') {
      base?.push(line);
    } else {
      theirs.push(line);
    }
  }
  return null;
}

export function countConflicts(file: ConflictedFile): number {
  return file.blocks.filter((block) => block.kind === 'conflict').length;
}

function blockLines(block: ConflictedFileBlock): readonly string[] {
  if (block.kind === 'text') {
    return block.lines;
  }
  return [
    `<<<<<<< ${block.oursLabel}`.trimEnd(),
    ...block.ours,
    ...(block.base === null ? [] : ['|||||||', ...block.base]),
    '=======',
    ...block.theirs,
    `>>>>>>> ${block.theirsLabel}`.trimEnd(),
  ];
}

export function renderConflictedFile(file: ConflictedFile): string {
  const lines = file.blocks.flatMap(blockLines);
  const content = lines.join('\n');
  return lines.length > 0 && file.endsWithNewline ? `${content}\n` : content;
}

function chosenLines(block: ConflictBlock, choice: ConflictChoice): readonly string[] {
  switch (choice) {
    case 'ours':
      return block.ours;
    case 'theirs':
      return block.theirs;
    case 'both':
      return [...block.ours, ...block.theirs];
  }
}

/** Replaces the conflict at `conflictIndex` (counting conflicts only) by the chosen lines. */
export function resolveConflict(
  content: string,
  conflictIndex: number,
  choice: ConflictChoice,
): string {
  const file = parseConflictedFile(content);
  let seen = -1;
  const blocks = file.blocks.map((block): ConflictedFileBlock => {
    if (block.kind === 'text') {
      return block;
    }
    seen += 1;
    return seen === conflictIndex ? { kind: 'text', lines: chosenLines(block, choice) } : block;
  });
  return renderConflictedFile({ ...file, blocks });
}
