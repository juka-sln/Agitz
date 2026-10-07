import type { Commit } from '@/domain/entities/Commit';
import { findHostedRepository, type Network } from '@/domain/entities/Network';
import type { Remote } from '@/domain/entities/Remote';
import {
  currentBranch,
  findRemote,
  findUpstream,
  type Repository,
} from '@/domain/entities/Repository';
import { NotARemoteRepositoryError, RepositoryNotFoundError } from '@/domain/errors/RemoteErrors';
import type { Hash } from '@/domain/value-objects/Hash';

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
