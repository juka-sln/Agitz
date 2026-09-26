import type { Head } from '@/domain/entities/Head';
import { getHeadCommitHash, type Repository } from '@/domain/entities/Repository';
import { collectReachableCommits, listCommitsInLogOrder } from '@/domain/services/history';
import { commitSubject } from '@/domain/value-objects/CommitMessage';
import type { Hash } from '@/domain/value-objects/Hash';
import type { Identity } from '@/domain/value-objects/Identity';
import type { Timestamp } from '@/domain/value-objects/Timestamp';

/** Lane used by commits only reachable from a detached HEAD. */
export const DETACHED_LANE = 'HEAD';

const PRIORITY_BRANCHES = ['main', 'master', 'develop'];

export interface GraphCommit {
  readonly hash: Hash;
  readonly subject: string;
  readonly author: Identity;
  readonly committedAt: Timestamp;
  readonly parents: readonly Hash[];
  /** Chronological position, 0 being the oldest commit. */
  readonly column: number;
  /** The branch whose first-parent line owns this commit, if any. */
  readonly lane: string | null;
  /** Branches whose tip is this commit. */
  readonly branches: readonly string[];
  readonly isHead: boolean;
  /** False for commits no branch or HEAD can reach anymore (e.g. left behind in detached HEAD). */
  readonly isReachable: boolean;
}

export interface CommitGraph {
  /** Oldest first. */
  readonly commits: readonly GraphCommit[];
  /** Lanes from top to bottom. */
  readonly lanes: readonly string[];
  readonly head: Head;
  readonly headCommit: Hash | null;
}

function orderBranches(repository: Repository): string[] {
  const names = Object.keys(repository.branches);
  const priority = PRIORITY_BRANCHES.filter((name) => names.includes(name));
  const others = names.filter((name) => !PRIORITY_BRANCHES.includes(name)).sort();
  return [...priority, ...others];
}

/**
 * Assigns each commit to one lane by following first parents from each branch tip,
 * in priority order, so a branch reads as one straight line like on a transit map.
 */
function assignLanes(repository: Repository): Map<Hash, string> {
  const lanes = new Map<Hash, string>();
  const tips: [string, Hash][] = orderBranches(repository).flatMap((name) => {
    const tip = repository.branches[name];
    return tip === undefined ? [] : [[name, tip] as [string, Hash]];
  });
  if (repository.head.type === 'detached') {
    tips.push([DETACHED_LANE, repository.head.commit]);
  }

  for (const [lane, tip] of tips) {
    let hash: Hash | undefined = tip;
    while (hash !== undefined && !lanes.has(hash)) {
      lanes.set(hash, lane);
      hash = repository.commits[hash]?.parents[0];
    }
  }
  return lanes;
}

export function getCommitGraph(repository: Repository): CommitGraph {
  const allHashes = Object.keys(repository.commits) as Hash[];
  const ordered = listCommitsInLogOrder(repository, allHashes).reverse();
  const headCommit = getHeadCommitHash(repository);
  const reachable = collectReachableCommits(repository, [
    ...Object.values(repository.branches),
    ...(headCommit === null ? [] : [headCommit]),
  ]);
  const lanes = assignLanes(repository);

  const tipsByCommit = new Map<Hash, string[]>();
  for (const name of orderBranches(repository)) {
    const tip = repository.branches[name];
    if (tip !== undefined) {
      tipsByCommit.set(tip, [...(tipsByCommit.get(tip) ?? []), name]);
    }
  }

  const commits = ordered.map((commit, column) => ({
    hash: commit.hash,
    subject: commitSubject(commit.message),
    author: commit.author,
    committedAt: commit.committedAt,
    parents: commit.parents,
    column,
    lane: lanes.get(commit.hash) ?? null,
    branches: tipsByCommit.get(commit.hash) ?? [],
    isHead: commit.hash === headCommit,
    isReachable: reachable.has(commit.hash),
  }));

  const firstColumnOfLane = new Map<string, number>();
  for (const commit of commits) {
    if (commit.lane !== null && !firstColumnOfLane.has(commit.lane)) {
      firstColumnOfLane.set(commit.lane, commit.column);
    }
  }
  const laneOrder = [...firstColumnOfLane.keys()].sort((left, right) => {
    const leftPriority = PRIORITY_BRANCHES.indexOf(left);
    const rightPriority = PRIORITY_BRANCHES.indexOf(right);
    if (leftPriority !== -1 || rightPriority !== -1) {
      return (
        (leftPriority === -1 ? Infinity : leftPriority) -
        (rightPriority === -1 ? Infinity : rightPriority)
      );
    }
    return (firstColumnOfLane.get(left) ?? 0) - (firstColumnOfLane.get(right) ?? 0);
  });

  return { commits, lanes: laneOrder, head: repository.head, headCommit };
}
