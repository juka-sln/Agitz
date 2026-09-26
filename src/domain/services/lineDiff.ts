export type LineOperationType = 'context' | 'added' | 'removed';

export interface LineOperation {
  readonly type: LineOperationType;
  readonly line: string;
}

export interface LineChangeCount {
  readonly insertions: number;
  readonly deletions: number;
}

export function splitLines(content: string): string[] {
  if (content === '') {
    return [];
  }
  const lines = content.split('\n');
  if (content.endsWith('\n')) {
    lines.pop();
  }
  return lines;
}

/** `lengthAt(i, j)` is the length of the longest common subsequence of `before[i..]` and `after[j..]`. */
function longestCommonSubsequence(before: readonly string[], after: readonly string[]) {
  const width = after.length + 1;
  const table = new Uint32Array((before.length + 1) * width);
  const lengthAt = (i: number, j: number) => table[i * width + j] ?? 0;

  for (let i = before.length - 1; i >= 0; i -= 1) {
    for (let j = after.length - 1; j >= 0; j -= 1) {
      table[i * width + j] =
        before[i] === after[j]
          ? lengthAt(i + 1, j + 1) + 1
          : Math.max(lengthAt(i + 1, j), lengthAt(i, j + 1));
    }
  }
  return lengthAt;
}

/** Line-based diff built on the longest common subsequence, after trimming the shared prefix and suffix. */
export function diffLines(beforeContent: string, afterContent: string): LineOperation[] {
  return diffLineArrays(splitLines(beforeContent), splitLines(afterContent));
}

export function diffLineArrays(
  before: readonly string[],
  after: readonly string[],
): LineOperation[] {
  let prefixLength = 0;
  while (
    prefixLength < before.length &&
    prefixLength < after.length &&
    before[prefixLength] === after[prefixLength]
  ) {
    prefixLength += 1;
  }
  let suffixLength = 0;
  while (
    suffixLength < before.length - prefixLength &&
    suffixLength < after.length - prefixLength &&
    before[before.length - 1 - suffixLength] === after[after.length - 1 - suffixLength]
  ) {
    suffixLength += 1;
  }

  const middleBefore = before.slice(prefixLength, before.length - suffixLength);
  const middleAfter = after.slice(prefixLength, after.length - suffixLength);
  const lengthAt = longestCommonSubsequence(middleBefore, middleAfter);

  const middle: LineOperation[] = [];
  let i = 0;
  let j = 0;
  for (
    let beforeLine = middleBefore[i], afterLine = middleAfter[j];
    beforeLine !== undefined && afterLine !== undefined;
    beforeLine = middleBefore[i], afterLine = middleAfter[j]
  ) {
    if (beforeLine === afterLine) {
      middle.push({ type: 'context', line: beforeLine });
      i += 1;
      j += 1;
    } else if (lengthAt(i + 1, j) >= lengthAt(i, j + 1)) {
      middle.push({ type: 'removed', line: beforeLine });
      i += 1;
    } else {
      middle.push({ type: 'added', line: afterLine });
      j += 1;
    }
  }
  middleBefore.slice(i).forEach((line) => middle.push({ type: 'removed', line }));
  middleAfter.slice(j).forEach((line) => middle.push({ type: 'added', line }));

  const toContext = (line: string): LineOperation => ({ type: 'context', line });
  return [
    ...before.slice(0, prefixLength).map(toContext),
    ...middle,
    ...before.slice(before.length - suffixLength).map(toContext),
  ];
}

export function countLineChanges(beforeContent: string, afterContent: string): LineChangeCount {
  const operations = diffLines(beforeContent, afterContent);
  return {
    insertions: operations.filter((operation) => operation.type === 'added').length,
    deletions: operations.filter((operation) => operation.type === 'removed').length,
  };
}
