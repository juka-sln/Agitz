import { findBranch, getCommit, getHeadCommitHash, type Repository } from '../entities/Repository';
import { AmbiguousRevisionError, UnknownRevisionError } from '../errors/RepositoryErrors';
import type { Hash } from '../value-objects/Hash';

const REVISION_PATTERN = /^([^~^]+)((?:[~^]\d*)*)$/;
const OPERATOR_PATTERN = /([~^])(\d*)/g;
const HASH_PREFIX_PATTERN = /^[0-9a-f]{4,40}$/;

function resolveBase(repository: Repository, base: string, revision: string): Hash {
  if (base === 'HEAD' || base === '@') {
    const head = getHeadCommitHash(repository);
    if (head === null) {
      throw new UnknownRevisionError(revision);
    }
    return head;
  }

  const branch = findBranch(repository, base);
  if (branch !== undefined) {
    return branch;
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
