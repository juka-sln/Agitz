import type { Commit } from '../entities/Commit';
import { getCommit, type Repository } from '../entities/Repository';
import type { Hash } from '../value-objects/Hash';

/** Every commit reachable from the given starting points, the starting points included. */
export function collectReachableCommits(
  repository: Repository,
  starts: readonly Hash[],
): Set<Hash> {
  const reachable = new Set<Hash>();
  const pending = [...starts];

  for (let hash = pending.pop(); hash !== undefined; hash = pending.pop()) {
    if (reachable.has(hash)) {
      continue;
    }
    reachable.add(hash);
    pending.push(...getCommit(repository, hash).parents);
  }
  return reachable;
}

export function isAncestor(repository: Repository, ancestor: Hash, descendant: Hash): boolean {
  return collectReachableCommits(repository, [descendant]).has(ancestor);
}

/** Removes and returns the most recent commit; the first one wins on equal dates. */
function takeNewest(commits: Commit[]): Commit | undefined {
  let newestIndex = -1;
  commits.forEach((commit, index) => {
    const newest = commits[newestIndex];
    if (!newest || commit.committedAt.epochSeconds > newest.committedAt.epochSeconds) {
      newestIndex = index;
    }
  });
  return newestIndex === -1 ? undefined : commits.splice(newestIndex, 1)[0];
}

/**
 * Orders reachable commits the way `git log` presents them: newest first, while
 * guaranteeing that a commit is never shown before one of its descendants.
 */
export function listCommitsInLogOrder(repository: Repository, starts: readonly Hash[]): Commit[] {
  const reachable = collectReachableCommits(repository, starts);
  const pendingChildren = new Map<Hash, number>();

  for (const hash of reachable) {
    for (const parent of getCommit(repository, hash).parents) {
      pendingChildren.set(parent, (pendingChildren.get(parent) ?? 0) + 1);
    }
  }

  const ready: Commit[] = [...new Set(starts)]
    .filter((hash) => !pendingChildren.has(hash))
    .map((hash) => getCommit(repository, hash));
  const ordered: Commit[] = [];

  let commit = takeNewest(ready);
  while (commit) {
    ordered.push(commit);

    for (const parent of commit.parents) {
      const remaining = (pendingChildren.get(parent) ?? 1) - 1;
      pendingChildren.set(parent, remaining);
      if (remaining === 0) {
        ready.push(getCommit(repository, parent));
      }
    }
    commit = takeNewest(ready);
  }
  return ordered;
}

/**
 * The best common ancestor of two commits, the starting point of a three-way merge:
 * a common ancestor that is not itself an ancestor of another common ancestor.
 */
export function findMergeBase(repository: Repository, left: Hash, right: Hash): Hash | null {
  const leftAncestors = collectReachableCommits(repository, [left]);
  const common = [...collectReachableCommits(repository, [right])].filter((hash) =>
    leftAncestors.has(hash),
  );
  const best = common.filter(
    (candidate) =>
      !common.some((other) => other !== candidate && isAncestor(repository, candidate, other)),
  );
  return (
    best
      .map((hash) => getCommit(repository, hash))
      .sort((a, b) => b.committedAt.epochSeconds - a.committedAt.epochSeconds)[0]?.hash ?? null
  );
}

/** How many commits each side has that the other lacks, as shown by `git status`. */
export function countDivergence(
  repository: Repository,
  local: Hash,
  upstream: Hash,
): { readonly ahead: number; readonly behind: number } {
  const localCommits = collectReachableCommits(repository, [local]);
  const upstreamCommits = collectReachableCommits(repository, [upstream]);
  const countMissing = (from: Set<Hash>, other: Set<Hash>) =>
    [...from].filter((hash) => !other.has(hash)).length;
  return {
    ahead: countMissing(localCommits, upstreamCommits),
    behind: countMissing(upstreamCommits, localCommits),
  };
}
