import type { UnmergedType } from '@/domain/entities/UnmergedEntry';
import type { Workspace } from '@/domain/entities/Workspace';
import { computeStatus } from '@/domain/services/status';
import type { FileChangeType } from '@/domain/value-objects/FileChange';
import { compareByteOrder } from '@/domain/value-objects/FilePath';

export interface WorkingTreeEntry {
  readonly path: string;
  /** Change recorded in the index compared to HEAD. */
  readonly staged: FileChangeType | null;
  /** Change on disk compared to the index, or `untracked` for files Git does not know. */
  readonly unstaged: FileChangeType | 'untracked' | null;
  /** Set while the file has a merge conflict waiting to be resolved. */
  readonly conflict: UnmergedType | null;
}

/** Every file of the project, including tracked files deleted from disk, with its Git state. */
export function getWorkingTreeEntries(workspace: Workspace): WorkingTreeEntry[] {
  const { repository } = workspace;
  if (!repository) {
    return Object.keys(workspace.files)
      .sort(compareByteOrder)
      .map((path) => ({ path, staged: null, unstaged: null, conflict: null }));
  }

  const status = computeStatus(repository, workspace.files);
  const entries = new Map<
    string,
    {
      staged: FileChangeType | null;
      unstaged: WorkingTreeEntry['unstaged'];
      conflict: UnmergedType | null;
    }
  >();
  const entryFor = (path: string) => {
    const entry = entries.get(path) ?? { staged: null, unstaged: null, conflict: null };
    entries.set(path, entry);
    return entry;
  };

  Object.keys(workspace.files).forEach(entryFor);
  status.staged.forEach(({ path, type }) => {
    entryFor(path).staged = type;
  });
  status.unstaged.forEach(({ path, type }) => {
    entryFor(path).unstaged = type;
  });
  status.untracked.forEach((path) => {
    entryFor(path).unstaged = 'untracked';
  });
  status.unmerged.forEach(({ path, type }) => {
    entryFor(path).conflict = type;
  });

  return [...entries.entries()]
    .sort(([left], [right]) => compareByteOrder(left, right))
    .map(([path, entry]) => ({ path, ...entry }));
}
