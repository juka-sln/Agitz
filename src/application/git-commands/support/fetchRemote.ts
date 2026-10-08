import { displayRepositoryUrl, type Network } from '@/domain/entities/Network';
import { remoteTrackingName } from '@/domain/entities/Remote';
import {
  branchNames,
  deleteRemoteBranch,
  findBranch,
  findRemoteBranch,
  findTag,
  remoteBranchesOf,
  setRemoteBranch,
  setTag,
  type Repository,
} from '@/domain/entities/Repository';
import { RemoteRefNotFoundError } from '@/domain/errors/RemoteErrors';
import { isAncestor } from '@/domain/services/history';
import { shortHash } from '@/domain/value-objects/Hash';

import {
  formatRefUpdates,
  requireHostedRepository,
  requireRemote,
  transferObjects,
  type RefUpdateLine,
} from './remotes';

export interface FetchOptions {
  readonly prune?: boolean;
  /** Only these remote branches; every branch when omitted. */
  readonly branches?: readonly string[] | undefined;
}

export interface FetchResult {
  readonly repository: Repository;
  /** `From <url>` followed by one line per updated ref; empty when nothing changed. */
  readonly lines: readonly string[];
  readonly updatedRefs: number;
  readonly url: string;
  /** Every branch the remote has right now. */
  readonly remoteBranches: readonly string[];
}

/**
 * Downloads the commits of a remote and moves its remote-tracking branches (`origin/*`)
 * to where the remote branches are now. Local branches and files are never touched.
 */
export function fetchRemote(
  repository: Repository,
  network: Network,
  remoteName: string,
  options: FetchOptions = {},
): FetchResult {
  const remote = requireRemote(repository, remoteName);
  const hosted = requireHostedRepository(network, remote.url);
  const available = branchNames(hosted);
  const requested = options.branches ?? available;
  for (const branch of requested) {
    if (findBranch(hosted, branch) === undefined) {
      throw new RemoteRefNotFoundError(branch);
    }
  }

  let next = repository;
  const updates: RefUpdateLine[] = [];

  if (options.prune === true && options.branches === undefined) {
    for (const branch of remoteBranchesOf(repository, remote.name)) {
      if (!available.includes(branch)) {
        const trackingName = remoteTrackingName(remote.name, branch);
        next = deleteRemoteBranch(next, trackingName);
        updates.push({ flag: '-', summary: '[deleted]', from: '(none)', to: trackingName });
      }
    }
  }

  for (const branch of [...requested].sort()) {
    const tip = findBranch(hosted, branch);
    const trackingName = remoteTrackingName(remote.name, branch);
    const previous = findRemoteBranch(next, trackingName);
    if (tip === undefined || previous === tip) {
      continue;
    }
    next = setRemoteBranch(transferObjects(hosted, next, [tip]), trackingName, tip);
    if (previous === undefined) {
      updates.push({ flag: '*', summary: '[new branch]', from: branch, to: trackingName });
    } else if (isAncestor(next, previous, tip)) {
      updates.push({
        flag: ' ',
        summary: `${shortHash(previous)}..${shortHash(tip)}`,
        from: branch,
        to: trackingName,
      });
    } else {
      updates.push({
        flag: '+',
        summary: `${shortHash(previous)}...${shortHash(tip)}`,
        from: branch,
        to: trackingName,
        reason: 'forced update',
      });
    }
  }

  for (const [name, tag] of Object.entries(hosted.tags).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    if (findTag(next, name) === undefined) {
      next = setTag(transferObjects(hosted, next, [tag.target]), name, tag);
      updates.push({ flag: '*', summary: '[new tag]', from: name, to: name });
    }
  }

  const lines =
    updates.length === 0
      ? []
      : [`From ${displayRepositoryUrl(remote.url)}`, ...formatRefUpdates(updates, 'fetch')];
  return {
    repository: next,
    lines,
    updatedRefs: updates.length,
    url: remote.url,
    remoteBranches: available,
  };
}
