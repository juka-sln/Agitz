import type { Commit } from '@/domain/entities/Commit';
import { findHostedRepository, type Network } from '@/domain/entities/Network';
import {
  remoteTrackingName,
  upstreamName,
  type Remote,
  type Upstream,
} from '@/domain/entities/Remote';
import {
  currentBranch,
  findBranch,
  findRemote,
  findRemoteBranch,
  findUpstream,
  remoteNames,
  type Repository,
} from '@/domain/entities/Repository';
import { NotARemoteRepositoryError, RepositoryNotFoundError } from '@/domain/errors/RemoteErrors';
import { countDivergence } from '@/domain/services/history';
import type { BranchName } from '@/domain/value-objects/BranchName';
import type { Hash } from '@/domain/value-objects/Hash';

import { pluralize } from './describeCommit';

export interface NamedRemote extends Remote {
  readonly name: string;
}

export function requireRemote(repository: Repository, name: string): NamedRemote {
  const remote = findRemote(repository, name);
  if (remote === undefined) {
    throw new NotARemoteRepositoryError(name);
  }
  return { name, ...remote };
}

export function requireHostedRepository(network: Network, url: string): Repository {
  const hosted = findHostedRepository(network, url);
  if (hosted === undefined) {
    throw new RepositoryNotFoundError(url);
  }
  return hosted;
}

/** The remote `git fetch` and `git pull` talk to by default: the upstream's, else `origin`. */
export function defaultRemoteName(repository: Repository): string {
  const branch = currentBranch(repository);
  return (branch === null ? undefined : findUpstream(repository, branch)?.remote) ?? 'origin';
}

/**
 * Copies into `target` the commits reachable from `tips` that it lacks, with the file
 * contents they need. Objects are content-addressed, so a shared hash means a shared object.
 */
export function transferObjects(
  source: Repository,
  target: Repository,
  tips: readonly Hash[],
): Repository {
  const commits: Record<string, Commit> = { ...target.commits };
  const blobs: Record<string, string> = { ...target.blobs };
  const pending = [...tips];

  for (let hash = pending.pop(); hash !== undefined; hash = pending.pop()) {
    const commit = source.commits[hash];
    if (Object.hasOwn(commits, hash) || commit === undefined) {
      continue;
    }
    commits[hash] = commit;
    for (const blob of Object.values(commit.tree)) {
      const content = source.blobs[blob];
      if (content !== undefined) {
        blobs[blob] = content;
      }
    }
    pending.push(...commit.parents);
  }
  return { ...target, commits, blobs };
}

export type RefUpdateFlag = '*' | ' ' | '+' | '-' | '!';

/** One line of the table printed by `git fetch` and `git push`. */
export interface RefUpdateLine {
  readonly flag: RefUpdateFlag;
  /** `[new branch]`, `a1b2c3d..e4f5a6b`, `[rejected]`... */
  readonly summary: string;
  readonly from: string;
  /** Omitted for deletions on push, which only name the remote ref. */
  readonly to: string | null;
  readonly reason?: string | undefined;
}

const SUMMARY_WIDTH = 17;
const MINIMUM_REF_WIDTH = 10;

/** `git fetch` aligns the arrows and sets reasons further apart than `git push` does. */
export function formatRefUpdates(
  lines: readonly RefUpdateLine[],
  layout: 'fetch' | 'push',
): string[] {
  const width =
    layout === 'fetch' ? Math.max(MINIMUM_REF_WIDTH, ...lines.map((line) => line.from.length)) : 0;
  const gap = layout === 'fetch' ? '  ' : ' ';
  return lines.map(({ flag, summary, from, to, reason }) => {
    const refs = to === null ? from : `${from.padEnd(width)} -> ${to}`;
    const suffix = reason === undefined ? '' : `${gap}(${reason})`;
    return ` ${flag} ${summary.padEnd(SUMMARY_WIDTH)} ${refs}${suffix}`;
  });
}

type Tracking =
  | { readonly state: 'none' }
  | { readonly state: 'gone'; readonly name: string }
  | {
      readonly state: 'tracked';
      readonly name: string;
      readonly ahead: number;
      readonly behind: number;
    };

export function describeUpstream(repository: Repository, branch: string): Tracking {
  const upstream: Upstream | undefined = findUpstream(repository, branch);
  const local = findBranch(repository, branch);
  if (upstream === undefined || local === undefined) {
    return { state: 'none' };
  }
  const name = upstreamName(upstream);
  const tracked = findRemoteBranch(repository, name);
  if (tracked === undefined) {
    return { state: 'gone', name };
  }
  return { state: 'tracked', name, ...countDivergence(repository, local, tracked) };
}

/** The paragraph `git status` and `git checkout` print about the upstream branch. */
export function formatTrackingStatus(repository: Repository, branch: string): string[] {
  const tracking = describeUpstream(repository, branch);
  switch (tracking.state) {
    case 'none':
      return [];
    case 'gone':
      return [
        `Your branch is based on '${tracking.name}', but the upstream is gone.`,
        '  (use "git branch --unset-upstream" to fixup)',
      ];
    case 'tracked': {
      const { name, ahead, behind } = tracking;
      if (ahead === 0 && behind === 0) {
        return [`Your branch is up to date with '${name}'.`];
      }
      if (behind === 0) {
        return [
          `Your branch is ahead of '${name}' by ${pluralize(ahead, 'commit')}.`,
          '  (use "git push" to publish your local commits)',
        ];
      }
      if (ahead === 0) {
        return [
          `Your branch is behind '${name}' by ${pluralize(behind, 'commit')}, and can be fast-forwarded.`,
          '  (use "git pull" to update your local branch)',
        ];
      }
      return [
        `Your branch and '${name}' have diverged,`,
        `and have ${String(ahead)} and ${String(behind)} different commits each, respectively.`,
        '  (use "git pull" if you want to integrate the remote branch with yours)',
      ];
    }
  }
}

/** `[origin/main: ahead 1, behind 2]` in `git branch -vv`, `[ahead 1]` in `git branch -v`. */
export function formatTrackingSummary(
  repository: Repository,
  branch: string,
  showName: boolean,
): string | null {
  const tracking = describeUpstream(repository, branch);
  if (tracking.state === 'none') {
    return null;
  }
  const details =
    tracking.state === 'gone'
      ? ['gone']
      : [
          ...(tracking.ahead > 0 ? [`ahead ${String(tracking.ahead)}`] : []),
          ...(tracking.behind > 0 ? [`behind ${String(tracking.behind)}`] : []),
        ];
  if (!showName) {
    return details.length === 0 ? null : `[${details.join(', ')}]`;
  }
  return details.length === 0 ? `[${tracking.name}]` : `[${tracking.name}: ${details.join(', ')}]`;
}

/**
 * The upstream a new branch gets when it starts from a remote-tracking branch
 * (`git branch feature origin/feature`), as Git's `branch.autoSetupMerge` does.
 */
export function upstreamForStartPoint(repository: Repository, startPoint: string): Upstream | null {
  const name = startPoint.replace(/^(refs\/)?remotes\//, '');
  if (
    findBranch(repository, startPoint) !== undefined ||
    findRemoteBranch(repository, name) === undefined
  ) {
    return null;
  }
  const remote = remoteNames(repository).find((candidate) => name.startsWith(`${candidate}/`));
  return remote === undefined
    ? null
    : { remote, branch: name.slice(remote.length + 1) as BranchName };
}

/** Remote-tracking branches named `<remote>/<branch>`, used to guess `git checkout <branch>`. */
export function remoteBranchCandidates(repository: Repository, branch: string): Upstream[] {
  return remoteNames(repository)
    .filter(
      (remote) => findRemoteBranch(repository, remoteTrackingName(remote, branch)) !== undefined,
    )
    .map((remote) => ({ remote, branch: branch as BranchName }));
}

export function formatUpstreamSetup(branch: string, upstream: Upstream): string {
  return `branch '${branch}' set up to track '${upstreamName(upstream)}'.`;
}
