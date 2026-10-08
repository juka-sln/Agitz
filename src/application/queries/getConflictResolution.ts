import type { PendingOperation } from '@/domain/entities/PendingOperation';
import { classifyUnmerged, type UnmergedType } from '@/domain/entities/UnmergedEntry';
import type { Workspace } from '@/domain/entities/Workspace';
import { containsConflictMarkers } from '@/domain/services/lineMerge';
import { compareByteOrder } from '@/domain/value-objects/FilePath';

export interface ConflictedPath {
  readonly path: string;
  readonly type: UnmergedType;
  /**
   * `resolve` while the file still holds conflict markers, then `stage`: only `git add`
   * tells Git the conflict is settled.
   */
  readonly step: 'resolve' | 'stage';
  readonly stageCommand: string;
}

export interface ConflictResolution {
  /** The operation that stopped, or `null` after a `git stash pop` (nothing to conclude). */
  readonly operation: PendingOperation['type'] | null;
  readonly files: readonly ConflictedPath[];
  /** What to run once every file is staged. */
  readonly continueCommand: string | null;
  readonly abortCommand: string | null;
}

function quotePath(path: string): string {
  return /^[\w./-]+$/.test(path) ? path : `"${path}"`;
}

const CONTINUE_COMMANDS: Record<PendingOperation['type'], string> = {
  merge: 'git commit',
  rebase: 'git rebase --continue',
  'cherry-pick': 'git cherry-pick --continue',
  revert: 'git revert --continue',
};

/** Where the user stands in a conflict, or `null` when there is none to deal with. */
export function getConflictResolution(workspace: Workspace): ConflictResolution | null {
  const { repository } = workspace;
  if (repository === null) {
    return null;
  }
  const { operation } = repository;
  const files = Object.entries(repository.unmerged)
    .sort(([left], [right]) => compareByteOrder(left, right))
    .map(([path, entry]): ConflictedPath => {
      const content = workspace.files[path];
      return {
        path,
        type: classifyUnmerged(entry),
        step: content !== undefined && containsConflictMarkers(content) ? 'resolve' : 'stage',
        stageCommand: `git add ${quotePath(path)}`,
      };
    });
  if (operation === null && files.length === 0) {
    return null;
  }

  return {
    operation: operation?.type ?? null,
    files,
    continueCommand: operation === null ? null : CONTINUE_COMMANDS[operation.type],
    abortCommand: operation === null ? null : `git ${operation.type} --abort`,
  };
}
