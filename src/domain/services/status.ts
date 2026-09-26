import { getBlobContent, getHeadTree, type Repository } from '../entities/Repository';
import { classifyUnmerged, type UnmergedType } from '../entities/UnmergedEntry';
import type { WorkingTree } from '../entities/Workspace';
import type { FileChange } from '../value-objects/FileChange';
import { compareByteOrder } from '../value-objects/FilePath';

import { diffTrees } from './treeDiff';

export interface UnmergedPath {
  readonly path: string;
  readonly type: UnmergedType;
}

export interface WorkingTreeStatus {
  /** Differences between HEAD and the index. */
  readonly staged: readonly FileChange[];
  /** Differences between the index and the working tree, for tracked files. */
  readonly unstaged: readonly FileChange[];
  readonly untracked: readonly string[];
  /** Conflicts waiting to be resolved; these paths are excluded from the other lists. */
  readonly unmerged: readonly UnmergedPath[];
}

export function computeStatus(repository: Repository, files: WorkingTree): WorkingTreeStatus {
  const isUnmerged = (path: string) => Object.hasOwn(repository.unmerged, path);
  const staged = diffTrees(getHeadTree(repository), repository.index)
    .filter(({ path }) => !isUnmerged(path))
    .map(({ path, type }) => ({ path, type }));

  const unstaged: FileChange[] = [];
  for (const path of Object.keys(repository.index).sort(compareByteOrder)) {
    const blob = repository.index[path];
    const content = files[path];
    if (blob === undefined) {
      continue;
    }
    if (content === undefined) {
      unstaged.push({ path, type: 'deleted' });
    } else if (content !== getBlobContent(repository, blob)) {
      unstaged.push({ path, type: 'modified' });
    }
  }

  const untracked = Object.keys(files)
    .filter((path) => !Object.hasOwn(repository.index, path) && !isUnmerged(path))
    .sort(compareByteOrder);

  const unmerged = Object.entries(repository.unmerged)
    .map(([path, entry]) => ({ path, type: classifyUnmerged(entry) }))
    .sort((left, right) => compareByteOrder(left.path, right.path));

  return { staged, unstaged, untracked, unmerged };
}

export function isWorkingTreeClean(status: WorkingTreeStatus): boolean {
  return status.staged.length === 0 && status.unstaged.length === 0 && status.unmerged.length === 0;
}
