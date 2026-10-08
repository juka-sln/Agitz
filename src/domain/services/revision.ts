import { upstreamName } from '../entities/Remote';
import {
  currentBranch,
  findBranch,
  findRemoteBranch,
  findTag,
  findUpstream,
  getCommit,
  getHeadCommitHash,
  type Repository,
} from '../entities/Repository';
import { NoUpstreamForBranchError } from '../errors/RemoteErrors';
import { AmbiguousRevisionError, UnknownRevisionError } from '../errors/RepositoryErrors';
import type { Hash } from '../value-objects/Hash';

const REVISION_PATTERN = /^([^~^]+)((?:[~^]\d*)*)$/;
const OPERATOR_PATTERN = /([~^])(\d*)/g;
const HASH_PREFIX_PATTERN = /^[0-9a-f]{4,40}$/;
const UPSTREAM_PATTERN = /^(.*)@\{(?:u|upstream)\}$/;

/** Fully qualified names (`refs/heads/main`, `refs/remotes/origin/main`) and their short forms. */
function resolveRefName(repository: Repository, name: string): Hash | undefined {
  const qualified = name.startsWith('refs/') ? name.slice('refs/'.length) : name;
  const [namespace = '', ...rest] = qualified.split('/');
  const shortName = rest.join('/');
  if (name !== qualified || ['heads', 'tags', 'remotes'].includes(namespace)) {
    switch (namespace) {
      case 'heads':
        return findBranch(repository, shortName);
      case 'tags':
        return findTag(repository, shortName)?.target;
      case 'remotes':
        return findRemoteBranch(repository, shortName);
      default:
        return undefined;
    }
  }
  // Like `git rev-parse`: tags, then branches, then remote-tracking branches.
  return (
    findTag(repository, name)?.target ??
    findBranch(repository, name) ??
    findRemoteBranch(repository, name)
  );
}

/** `@{u}` or `feature@{upstream}`: the remote-tracking branch a local branch follows. */
function resolveUpstream(repository: Repository, branchName: string, revision: string): Hash {
  const branch = branchName === '' ? currentBranch(repository) : branchName;
  if (branch === null) {
    throw new UnknownRevisionError(revision);
  }
  const upstream = findUpstream(repository, branch);
  if (upstream === undefined) {
    throw new NoUpstreamForBranchError(branch);
  }
  const hash = findRemoteBranch(repository, upstreamName(upstream));
  if (hash === undefined) {
    throw new UnknownRevisionError(revision);
  }
  return hash;
}

function resolveBase(repository: Repository, base: string, revision: string): Hash {
  if (base === 'HEAD' || base === '@') {
    const head = getHeadCommitHash(repository);
    if (head === null) {
      throw new UnknownRevisionError(revision);
    }
    return head;
  }

  const upstream = UPSTREAM_PATTERN.exec(base);
  if (upstream) {
    return resolveUpstream(repository, upstream[1] ?? '', revision);
  }

  const ref = resolveRefName(repository, base);
  if (ref !== undefined) {
    return ref;
  }

  if (HASH_PREFIX_PATTERN.test(base)) {
    const candidates = (Object.keys(repository.commits) as Hash[]).filter((hash) =>
      hash.startsWith(base),
    );
    if (candidates.length > 1) {
      throw new AmbiguousRevisionError(base);
    }
    if (candidates[0] !== undefined) {
      return candidates[0];
    }
  }
  throw new UnknownRevisionError(revision);
}

/**
 * Resolves a revision such as `HEAD`, `main`, `a1b2c3d`, `HEAD~2` or `feature^2` to a commit hash.
 * `~n` follows the first parent n times, `^n` selects the n-th parent (`^0` is the commit itself).
 */
export function resolveRevision(repository: Repository, revision: string): Hash {
  const match = REVISION_PATTERN.exec(revision);
  if (!match) {
    throw new UnknownRevisionError(revision);
  }
  const [, base = '', operators = ''] = match;
  let hash = resolveBase(repository, base, revision);

  for (const [, operator, digits] of operators.matchAll(OPERATOR_PATTERN)) {
    const count = digits === undefined || digits === '' ? 1 : Number(digits);
    const { parents } = getCommit(repository, hash);

    if (operator === '~') {
      for (let step = 0; step < count; step += 1) {
        const parent = getCommit(repository, hash).parents[0];
        if (parent === undefined) {
          throw new UnknownRevisionError(revision);
        }
        hash = parent;
      }
    } else if (count > 0) {
      const parent = parents[count - 1];
      if (parent === undefined) {
        throw new UnknownRevisionError(revision);
      }
      hash = parent;
    }
  }
  return hash;
}

export function tryResolveRevision(repository: Repository, revision: string): Hash | null {
  try {
    return resolveRevision(repository, revision);
  } catch (error) {
    if (error instanceof UnknownRevisionError) {
      return null;
    }
    throw error;
  }
}
