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
  /** Remote-tracking branches (`origin/main`) whose last known tip is this commit. */
  readonly remoteBranches: readonly string[];
  readonly tags: readonly string[];
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
  // Commits only a remote-tracking branch knows (fetched, not merged yet) get their own lane.
  tips.push(
    ...Object.entries(repository.remoteBranches).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );

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
    ...Object.values(repository.remoteBranches),
    ...Object.values(repository.tags).map((tag) => tag.target),
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

  const remoteTipsByCommit = new Map<Hash, string[]>();
  for (const [name, tip] of Object.entries(repository.remoteBranches).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    remoteTipsByCommit.set(tip, [...(remoteTipsByCommit.get(tip) ?? []), name]);
  }

  const tagsByCommit = new Map<Hash, string[]>();
  for (const [name, tag] of Object.entries(repository.tags).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    tagsByCommit.set(tag.target, [...(tagsByCommit.get(tag.target) ?? []), name]);
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
    remoteBranches: remoteTipsByCommit.get(commit.hash) ?? [],
    tags: tagsByCommit.get(commit.hash) ?? [],
    isHead: commit.hash === headCommit,
    isReachable: reachable.has(commit.hash),
  }));

  const firstColumnOfLane = new Map<string, number>();
  for (const commit of commits) {
    if (commit.lane !== null && !firstColumnOfLane.has(commit.lane)) {
      firstColumnOfLane.set(commit.lane, commit.column);
    }
  }
  // A remote-tracking lane (`origin/main`) sits right below the local branch it mirrors.
  const localName = (lane: string) =>
    Object.hasOwn(repository.remoteBranches, lane) ? lane.slice(lane.indexOf('/') + 1) : lane;
  const priorityOf = (lane: string) => {
    const index = PRIORITY_BRANCHES.indexOf(localName(lane));
    return index === -1 ? Infinity : index;
  };
  const columnOf = (lane: string) =>
    firstColumnOfLane.get(localName(lane)) ?? firstColumnOfLane.get(lane) ?? 0;
  const laneOrder = [...firstColumnOfLane.keys()].sort(
    (left, right) =>
      priorityOf(left) - priorityOf(right) ||
      columnOf(left) - columnOf(right) ||
      Number(localName(left) !== left) - Number(localName(right) !== right) ||
      left.localeCompare(right),
  );

  return { commits, lanes: laneOrder, head: repository.head, headCommit };
}
