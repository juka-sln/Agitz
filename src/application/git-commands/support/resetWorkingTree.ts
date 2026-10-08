import { getBlobContent, getHeadTree, type Repository } from '@/domain/entities/Repository';
import type { Tree } from '@/domain/entities/Tree';
import type { WorkingTree } from '@/domain/entities/Workspace';

/**
 * Gives every tracked path the content it has in `target`, like `git reset --hard`:
 * files known to the index, HEAD, the conflicts or the target are rewritten or
 * deleted, while untracked files are left alone.
 */
export function resetWorkingTree(
  repository: Repository,
  files: WorkingTree,
  target: Tree,
): WorkingTree {
  const next = new Map(Object.entries(files));
  const tracked = new Set([
    ...Object.keys(repository.index),
    ...Object.keys(getHeadTree(repository)),
    ...Object.keys(repository.unmerged),
    ...Object.keys(target),
  ]);
  for (const path of tracked) {
    const blob = target[path];
    if (blob === undefined) {
      next.delete(path);
    } else {
      next.set(path, getBlobContent(repository, blob));
    }
  }
  return Object.fromEntries(next);
}
