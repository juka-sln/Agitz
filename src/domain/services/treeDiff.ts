import type { Tree } from '../entities/Tree';
import type { FileChangeType } from '../value-objects/FileChange';
import { compareByteOrder } from '../value-objects/FilePath';
import type { Hash } from '../value-objects/Hash';

export interface TreeChange {
  readonly path: string;
  readonly type: FileChangeType;
  readonly before: Hash | null;
  readonly after: Hash | null;
}

export function diffTrees(from: Tree, to: Tree): TreeChange[] {
  const paths = new Set([...Object.keys(from), ...Object.keys(to)]);
  const changes: TreeChange[] = [];

  for (const path of [...paths].sort(compareByteOrder)) {
    const before = from[path] ?? null;
    const after = to[path] ?? null;
    if (before === after) {
      continue;
    }
    let type: FileChangeType = 'modified';
    if (before === null) {
      type = 'added';
    } else if (after === null) {
      type = 'deleted';
    }
    changes.push({ path, type, before, after });
  }
  return changes;
}
