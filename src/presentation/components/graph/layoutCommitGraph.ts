import type { Edge, Node } from '@xyflow/react';

import {
  DETACHED_LANE,
  type CommitGraph,
  type GraphCommit,
} from '@/application/queries/getCommitGraph';

import type { StationMotion } from './graphMotion';

export const COLUMN_WIDTH = 170;
export const ROW_HEIGHT = 140;
export const STATION_SIZE = 22;

const LINE_COLOR_COUNT = 6;

export type HeadState = 'attached' | 'detached' | null;

export interface StationData extends Record<string, unknown> {
  readonly commit: GraphCommit;
  /** Name of the line color token, e.g. `line-0`; `--<token>-ink` is its readable text color. */
  readonly lineToken: string;
  readonly headState: HeadState;
  readonly currentBranch: string | null;
  /** Line token of each branch whose tip is this commit. */
  readonly branchTokens: Readonly<Record<string, string>>;
  /** Line token of each remote-tracking branch here: its own lane, else its local branch's. */
  readonly remoteBranchTokens: Readonly<Record<string, string>>;
  /** How the station enters, when the last command moved or replayed it. */
  readonly motion?: StationMotion;
}

export interface TransitEdgeData extends Record<string, unknown> {
  readonly lineToken: string;
  /** Where the diagonal sits: right after a fork (source) or right before a merge (target). */
  readonly bend: 'source' | 'target';
  /** Shifts the vertical drop so parallel lines forking from one station stay distinct. */
  readonly offset: number;
  readonly faded: boolean;
  /** Set on lines leading to a replayed commit, which only show once it has landed. */
  readonly appearsAfterMs?: number;
}

export type StationNode = Node<StationData, 'station'>;
export type TransitEdge = Edge<TransitEdgeData, 'transit'>;

export function laneToken(lane: string | null, lanes: readonly string[]): string {
  if (lane === DETACHED_LANE) {
    return 'line-detached';
  }
  const index = lane === null ? -1 : lanes.indexOf(lane);
  return index === -1 ? 'line-none' : `line-${index % LINE_COLOR_COUNT}`;
}

/**
 * Places each commit in its chronological column and on its branch row, so every
 * branch reads as a straight line. Commits without a branch share the bottom row.
 */
export function layoutCommitGraph(graph: CommitGraph): {
  nodes: StationNode[];
  edges: TransitEdge[];
} {
  const rowOf = (lane: string | null) =>
    lane === null ? graph.lanes.length : graph.lanes.indexOf(lane);
  const commitsByHash = new Map(graph.commits.map((commit) => [commit.hash, commit]));
  const headState: HeadState = graph.head.type;
  const currentBranch = graph.head.type === 'attached' ? graph.head.branch : null;

  const nodes = graph.commits.map<StationNode>((commit) => ({
    id: commit.hash,
    type: 'station',
    position: { x: commit.column * COLUMN_WIDTH, y: rowOf(commit.lane) * ROW_HEIGHT },
    width: STATION_SIZE,
    height: STATION_SIZE,
    draggable: false,
    connectable: false,
    data: {
      commit,
      lineToken: laneToken(commit.lane, graph.lanes),
      headState: commit.isHead ? headState : null,
      currentBranch,
      branchTokens: Object.fromEntries(
        commit.branches.map((branch) => [
          branch,
          laneToken(graph.lanes.includes(branch) ? branch : null, graph.lanes),
        ]),
      ),
      remoteBranchTokens: Object.fromEntries(
        commit.remoteBranches.map((name) => {
          const local = name.slice(name.indexOf('/') + 1);
          const lane = [name, local].find((candidate) => graph.lanes.includes(candidate));
          return [name, laneToken(lane ?? null, graph.lanes)];
        }),
      ),
    },
  }));

  const forksPerParent = new Map<string, number>();
  const edges = graph.commits.flatMap((commit) =>
    commit.parents.flatMap<TransitEdge>((parentHash, index) => {
      const parent = commitsByHash.get(parentHash);
      if (!parent) {
        return [];
      }
      const isFirstParent = index === 0;
      const isFork = isFirstParent && parent.lane !== commit.lane;
      const forkIndex = isFork ? (forksPerParent.get(parentHash) ?? 0) : 0;
      if (isFork) {
        forksPerParent.set(parentHash, forkIndex + 1);
      }
      return [
        {
          id: `${parentHash}-${commit.hash}`,
          source: parentHash,
          target: commit.hash,
          type: 'transit',
          data: {
            lineToken: laneToken(isFirstParent ? commit.lane : parent.lane, graph.lanes),
            bend: isFirstParent ? 'source' : 'target',
            offset: forkIndex * PARALLEL_LINE_SPACING,
            faded: !commit.isReachable,
          },
        },
      ];
    }),
  );

  return { nodes, edges };
}

const CORNER = 24;
const PARALLEL_LINE_SPACING = 10;

/**
 * Transit-map path between two stations: horizontal runs, 45° corners and a
 * vertical drop placed halfway between two columns, where no label ever sits.
 * The drop happens right after a fork (`source`) or right before a merge (`target`).
 */
export function transitPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  bend: 'source' | 'target',
  offset = 0,
): string {
  const deltaY = targetY - sourceY;
  if (Math.abs(deltaY) < 1) {
    return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  }
  const direction = Math.sign(deltaY);
  const corner = Math.min(CORNER, Math.abs(deltaY) / 2);
  const gapCenter = (COLUMN_WIDTH - STATION_SIZE) / 2;
  const dropX = (bend === 'source' ? sourceX + gapCenter : targetX - gapCenter) + offset;

  return [
    `M ${sourceX} ${sourceY}`,
    `L ${dropX - corner} ${sourceY}`,
    `L ${dropX} ${sourceY + direction * corner}`,
    `L ${dropX} ${targetY - direction * corner}`,
    `L ${dropX + corner} ${targetY}`,
    `L ${targetX} ${targetY}`,
  ].join(' ');
}
