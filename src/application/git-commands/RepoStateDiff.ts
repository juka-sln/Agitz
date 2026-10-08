import type { Head } from '@/domain/entities/Head';
import type { Repository } from '@/domain/entities/Repository';
import type { Workspace } from '@/domain/entities/Workspace';
import type { Hash } from '@/domain/value-objects/Hash';

export interface RefUpdate {
  readonly branch: string;
  readonly before: Hash | null;
  readonly after: Hash | null;
}

/** What a command changed, so the UI can animate exactly those parts of the graph. */
export interface RepoStateDiff {
  readonly repositoryCreated: boolean;
  readonly createdCommits: readonly Hash[];
  readonly refUpdates: readonly RefUpdate[];
  readonly headBefore: Head | null;
  readonly headAfter: Head | null;
  readonly headChanged: boolean;
  readonly indexChanged: boolean;
  readonly workingTreeChanged: boolean;
}

export const NO_CHANGES: RepoStateDiff = {
  repositoryCreated: false,
  createdCommits: [],
  refUpdates: [],
  headBefore: null,
  headAfter: null,
  headChanged: false,
  indexChanged: false,
  workingTreeChanged: false,
};

function recordsAreEqual<T>(left: Readonly<Record<string, T>>, right: Readonly<Record<string, T>>) {
  const leftKeys = Object.keys(left);
  return (
    leftKeys.length === Object.keys(right).length &&
    leftKeys.every((key) => Object.hasOwn(right, key) && left[key] === right[key])
  );
}

function headsAreEqual(left: Head | null, right: Head | null): boolean {
  if (left === null || right === null) {
    return left === right;
  }
  if (left.type === 'attached' && right.type === 'attached') {
    return left.branch === right.branch;
  }
  if (left.type === 'detached' && right.type === 'detached') {
    return left.commit === right.commit;
  }
  return false;
}

function diffRefs(before: Repository | null, after: Repository | null): RefUpdate[] {
  const beforeBranches = before?.branches ?? {};
  const afterBranches = after?.branches ?? {};
  const names = new Set([...Object.keys(beforeBranches), ...Object.keys(afterBranches)]);

  return [...names]
    .sort()
    .map((branch) => ({
      branch,
      before: beforeBranches[branch] ?? null,
      after: afterBranches[branch] ?? null,
    }))
    .filter((update) => update.before !== update.after);
}

export function diffWorkspaces(before: Workspace, after: Workspace): RepoStateDiff {
  const previous = before.repository;
  const next = after.repository;
  const previousCommits = previous?.commits ?? {};
  const headBefore = previous?.head ?? null;
  const headAfter = next?.head ?? null;

  return {
    repositoryCreated: previous === null && next !== null,
    createdCommits: (Object.keys(next?.commits ?? {}) as Hash[]).filter(
      (hash) => !Object.hasOwn(previousCommits, hash),
    ),
    refUpdates: diffRefs(previous, next),
    headBefore,
    headAfter,
    headChanged: !headsAreEqual(headBefore, headAfter),
    indexChanged: !recordsAreEqual(previous?.index ?? {}, next?.index ?? {}),
    workingTreeChanged: !recordsAreEqual(before.files, after.files),
  };
}
