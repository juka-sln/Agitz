import type { GraphCommit } from '@/application/queries/getCommitGraph';

import type { StationNode } from './layoutCommitGraph';

export interface Offset {
  readonly x: number;
  readonly y: number;
}

/** How a station enters the map, relative to where it now stands. */
export interface StationMotion {
  /** Where the commit it replays stood: rebase, cherry-pick and amend copy commits. */
  readonly replayedFrom: Offset | null;
  /** Replayed commits arrive one after the other, in the order Git applied them. */
  readonly delayMs: number;
  /**
   * Where each label (`branch:main`, `remote:origin/main`, `HEAD`) stood before, relative to
   * where the station starts: a replayed station already carries its labels along.
   */
  readonly labelsFrom: Readonly<Record<string, Offset>>;
}

export type GraphMotion = ReadonlyMap<string, StationMotion>;

export const NO_MOTION: GraphMotion = new Map();

export const REPLAY_STAGGER_MS = 90;
/** Matches the `station-replay` animation in the stylesheet. */
export const REPLAY_DURATION_MS = 600;

export const branchLabel = (branch: string) => `branch:${branch}`;
export const remoteLabel = (name: string) => `remote:${name}`;
export const HEAD_LABEL = 'HEAD';

/** Same author, same authoring time and same subject: the copy of a commit. */
function replayKey(commit: GraphCommit): string {
  const { author, authoredAt, subject } = commit;
  return [author.email, authoredAt.epochSeconds, authoredAt.timezoneOffsetMinutes, subject].join(
    '\n',
  );
}

function labelsOf(node: StationNode): string[] {
  const { commit, headState } = node.data;
  return [
    ...commit.branches.map(branchLabel),
    ...commit.remoteBranches.map(remoteLabel),
    ...(headState === null ? [] : [HEAD_LABEL]),
  ];
}

function offsetBetween(from: Offset, to: Offset): Offset {
  return { x: from.x - to.x, y: from.y - to.y };
}

/**
 * Compares two successive maps of the same repository to tell what moved: commits that were
 * replayed elsewhere, and labels that jumped from one station to another.
 */
export function describeGraphMotion(
  previous: readonly StationNode[],
  next: readonly StationNode[],
): GraphMotion {
  const previousHashes = new Set(previous.map((node) => node.id));
  const originals = new Map<string, Offset>();
  for (const node of previous) {
    originals.set(replayKey(node.data.commit), node.position);
  }
  const labelPositions = new Map<string, Offset>();
  for (const node of previous) {
    for (const label of labelsOf(node)) {
      labelPositions.set(label, node.position);
    }
  }

  const motion = new Map<string, StationMotion>();
  let replayed = 0;
  for (const node of next) {
    const isNew = !previousHashes.has(node.id);
    const original = isNew ? originals.get(replayKey(node.data.commit)) : undefined;
    const start = original ?? node.position;
    const labelsFrom = Object.fromEntries(
      labelsOf(node).flatMap((label) => {
        const before = labelPositions.get(label);
        return before === undefined || (before.x === start.x && before.y === start.y)
          ? []
          : [[label, offsetBetween(before, start)]];
      }),
    );
    if (original === undefined && Object.keys(labelsFrom).length === 0) {
      continue;
    }
    motion.set(node.id, {
      replayedFrom: original === undefined ? null : offsetBetween(original, node.position),
      delayMs: original === undefined ? 0 : replayed * REPLAY_STAGGER_MS,
      labelsFrom,
    });
    if (original !== undefined) {
      replayed += 1;
    }
  }
  return motion;
}
