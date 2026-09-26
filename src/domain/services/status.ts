import { getBlobContent, getHeadTree, type Repository } from '../entities/Repository';
import type { WorkingTree } from '../entities/Workspace';
import type { FileChange } from '../value-objects/FileChange';
import { compareByteOrder } from '../value-objects/FilePath';

import { diffTrees } from './treeDiff';

export interface WorkingTreeStatus {
  /** Differences between HEAD and the index. */
  readonly staged: readonly FileChange[];
  /** Differences between the index and the working tree, for tracked files. */
  readonly unstaged: readonly FileChange[];
  readonly untracked: readonly string[];
}

export function computeStatus(repository: Repository, files: WorkingTree): WorkingTreeStatus {
  const staged = diffTrees(getHeadTree(repository), repository.index).map(({ path, type }) => ({
    path,
    type,
  }));

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
    .filter((path) => !Object.hasOwn(repository.index, path))
    .sort(compareByteOrder);

  return { staged, unstaged, untracked };
}

export function isWorkingTreeClean(status: WorkingTreeStatus): boolean {
  return status.staged.length === 0 && status.unstaged.length === 0;
}
