import { getBlobContent, getHeadTree, type Repository } from '@/domain/entities/Repository';
import type { Tree } from '@/domain/entities/Tree';
import type { UnmergedEntry } from '@/domain/entities/UnmergedEntry';
import type { WorkingTree } from '@/domain/entities/Workspace';
import {
  LocalChangesWouldBeOverwrittenError,
  UntrackedFilesWouldBeOverwrittenError,
} from '@/domain/errors/WorkingTreeErrors';
import { mergeLines, type MergeLabels } from '@/domain/services/lineMerge';
import { diffTrees } from '@/domain/services/treeDiff';
import { compareByteOrder } from '@/domain/value-objects/FilePath';
import type { Hash } from '@/domain/value-objects/Hash';

import type { ObjectHasher } from '../../ports/ObjectHasher';

import { storeBlob } from './objects';

export interface TreeMergeResult {
  /** The repository with the blobs of merged files stored. */
  readonly repository: Repository;
  /** Every cleanly merged path; conflicted paths are left out. */
  readonly tree: Tree;
  readonly conflicts: Readonly<Record<string, UnmergedEntry>>;
  /** Working tree content for each path that differs from `ours` (`null` deletes the file). */
  readonly files: Readonly<Record<string, string | null>>;
  /** `Auto-merging` and `CONFLICT (...)` lines, as Git prints them. */
  readonly messages: readonly string[];
}

export interface MergeInputs {
  readonly base: Tree;
  readonly ours: Tree;
  readonly theirs: Tree;
}

/** Three-way merge of two snapshots, file by file, against their common ancestor. */
export function mergeTrees(
  hasher: ObjectHasher,
  initial: Repository,
  { base, ours, theirs }: MergeInputs,
  labels: MergeLabels,
): TreeMergeResult {
  let repository = initial;
  const tree = new Map<string, Hash>(Object.entries(ours));
  const conflicts: Record<string, UnmergedEntry> = {};
  const files: Record<string, string | null> = {};
  const messages: string[] = [];
  const content = (hash: Hash | null) => (hash === null ? '' : getBlobContent(repository, hash));

  const paths = [...new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)])];
  for (const path of paths.sort(compareByteOrder)) {
    const baseHash = base[path] ?? null;
    const oursHash = ours[path] ?? null;
    const theirsHash = theirs[path] ?? null;

    if (oursHash === theirsHash || baseHash === theirsHash) {
      continue;
    }
    if (baseHash === oursHash) {
      if (theirsHash === null) {
        tree.delete(path);
        files[path] = null;
      } else {
        tree.set(path, theirsHash);
        files[path] = content(theirsHash);
      }
      continue;
    }

    if (oursHash === null || theirsHash === null) {
      const [deletedIn, modifiedIn] =
        oursHash === null ? [labels.ours, labels.theirs] : [labels.theirs, labels.ours];
      messages.push(
        `CONFLICT (modify/delete): ${path} deleted in ${deletedIn} and modified in ${modifiedIn}.  Version ${modifiedIn} of ${path} left in tree.`,
      );
      conflicts[path] = { base: baseHash, ours: oursHash, theirs: theirsHash };
      tree.delete(path);
      if (oursHash === null) {
        files[path] = content(theirsHash);
      }
      continue;
    }

    messages.push(`Auto-merging ${path}`);
    const merged = mergeLines(content(baseHash), content(oursHash), content(theirsHash), labels);
    files[path] = merged.content;
    if (merged.conflicted) {
      messages.push(
        `CONFLICT (${baseHash === null ? 'add/add' : 'content'}): Merge conflict in ${path}`,
      );
      conflicts[path] = { base: baseHash, ours: oursHash, theirs: theirsHash };
      tree.delete(path);
    } else {
      const stored = storeBlob(hasher, repository, merged.content);
      repository = stored.repository;
      tree.set(path, stored.hash);
    }
  }

  return { repository, tree: Object.fromEntries(tree), conflicts, files, messages };
}

export interface AppliedMerge {
  readonly repository: Repository;
  readonly files: WorkingTree;
}

/**
 * Writes a merge result into the index and working tree, refusing, like Git, when
 * staged changes exist or when the merge would overwrite uncommitted work.
 */
export function applyMergeResult(
  repository: Repository,
  files: WorkingTree,
  result: TreeMergeResult,
  operation: string,
): AppliedMerge {
  const headTree = getHeadTree(repository);
  const staged = diffTrees(headTree, repository.index).map((change) => change.path);
  if (staged.length > 0) {
    throw new LocalChangesWouldBeOverwrittenError(operation, staged);
  }

  const affected = [
    ...new Set([...Object.keys(result.files), ...Object.keys(result.conflicts)]),
  ].sort(compareByteOrder);
  const localChanges: string[] = [];
  const untrackedInTheWay: string[] = [];
  for (const path of affected) {
    const tracked = repository.index[path];
    const onDisk = files[path];
    const expected = tracked === undefined ? undefined : getBlobContent(repository, tracked);
    if (onDisk === expected) {
      continue;
    }
    if (tracked === undefined) {
      if (onDisk !== result.files[path]) {
        untrackedInTheWay.push(path);
      }
    } else {
      localChanges.push(path);
    }
  }
  if (localChanges.length > 0) {
    throw new LocalChangesWouldBeOverwrittenError(operation, localChanges);
  }
  if (untrackedInTheWay.length > 0) {
    throw new UntrackedFilesWouldBeOverwrittenError(operation, untrackedInTheWay);
  }

  const nextFiles = new Map(Object.entries(files));
  for (const [path, value] of Object.entries(result.files)) {
    if (value === null) {
      nextFiles.delete(path);
    } else {
      nextFiles.set(path, value);
    }
  }

  return {
    repository: { ...result.repository, index: result.tree, unmerged: result.conflicts },
    files: Object.fromEntries(nextFiles),
  };
}
