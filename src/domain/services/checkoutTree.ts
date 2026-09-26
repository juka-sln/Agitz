import { getBlobContent, getHeadTree, type Repository } from '../entities/Repository';
import type { Tree } from '../entities/Tree';
import type { WorkingTree } from '../entities/Workspace';
import {
  LocalChangesWouldBeOverwrittenError,
  UntrackedFilesWouldBeOverwrittenError,
} from '../errors/WorkingTreeErrors';
import { compareByteOrder } from '../value-objects/FilePath';
import type { Hash } from '../value-objects/Hash';

export interface CheckedOutState {
  readonly index: Tree;
  readonly files: WorkingTree;
}

/**
 * Moves the index and working tree from the HEAD snapshot to `target`, like Git's
 * two-way merge: paths identical in both snapshots keep their local changes,
 * while differing paths are only updated when they have no local changes.
 */
export function checkoutTree(
  repository: Repository,
  files: WorkingTree,
  target: Tree,
  operation: string,
): CheckedOutState {
  const current = getHeadTree(repository);
  const { index } = repository;
  const nextIndex = new Map<string, Hash>(Object.entries(index));
  const nextFiles = new Map<string, string>(Object.entries(files));
  const overwrittenLocalChanges: string[] = [];
  const overwrittenUntracked: string[] = [];

  const contentOf = (blob: Hash | undefined) =>
    blob === undefined ? undefined : getBlobContent(repository, blob);

  const paths = [...new Set([...Object.keys(current), ...Object.keys(target)])].sort(
    compareByteOrder,
  );

  for (const path of paths) {
    const from = current[path];
    const to = target[path];
    if (from === to) {
      continue;
    }
    const indexed = index[path];
    const onDisk = files[path];
    const targetContent = contentOf(to);
    const workingTreeMatchesIndex = onDisk === contentOf(indexed);

    if (indexed === to && workingTreeMatchesIndex) {
      continue;
    }
    if (indexed === undefined && from === undefined && onDisk !== undefined) {
      if (onDisk !== targetContent) {
        overwrittenUntracked.push(path);
      }
    } else if (indexed !== from || !workingTreeMatchesIndex) {
      overwrittenLocalChanges.push(path);
      continue;
    }

    if (to === undefined || targetContent === undefined) {
      nextIndex.delete(path);
      nextFiles.delete(path);
    } else {
      nextIndex.set(path, to);
      nextFiles.set(path, targetContent);
    }
  }

  if (overwrittenLocalChanges.length > 0) {
    throw new LocalChangesWouldBeOverwrittenError(operation, overwrittenLocalChanges);
  }
  if (overwrittenUntracked.length > 0) {
    throw new UntrackedFilesWouldBeOverwrittenError(operation, overwrittenUntracked);
  }
  return { index: Object.fromEntries(nextIndex), files: Object.fromEntries(nextFiles) };
}
