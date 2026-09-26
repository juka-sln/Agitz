import type { BranchName } from '../value-objects/BranchName';
import type { Hash } from '../value-objects/Hash';

import type { Commit } from './Commit';
import { attachedHead, type Head } from './Head';
import { EMPTY_TREE, type Tree } from './Tree';

export const DEFAULT_INITIAL_BRANCH = 'main' as BranchName;

export interface Repository {
  readonly commits: Readonly<Record<string, Commit>>;
  readonly blobs: Readonly<Record<string, string>>;
  readonly branches: Readonly<Record<string, Hash>>;
  readonly head: Head;
  /** The staging area: the snapshot that the next commit will record. */
  readonly index: Tree;
}

export function createEmptyRepository(initialBranch: BranchName): Repository {
  return {
    commits: {},
    blobs: {},
    branches: {},
    head: attachedHead(initialBranch),
    index: EMPTY_TREE,
  };
}

export function findCommit(repository: Repository, hash: Hash): Commit | undefined {
  return repository.commits[hash];
}

export function getCommit(repository: Repository, hash: Hash): Commit {
  const commit = findCommit(repository, hash);
  if (!commit) {
    throw new Error(`Missing commit object ${hash}`);
  }
  return commit;
}

export function getBlobContent(repository: Repository, hash: Hash): string {
  const content = repository.blobs[hash];
  if (content === undefined) {
    throw new Error(`Missing blob object ${hash}`);
  }
  return content;
}

export function findBranch(repository: Repository, name: string): Hash | undefined {
  return Object.hasOwn(repository.branches, name) ? repository.branches[name] : undefined;
}

export function branchNames(repository: Repository): BranchName[] {
  return (Object.keys(repository.branches) as BranchName[]).sort();
}

export function currentBranch(repository: Repository): BranchName | null {
  return repository.head.type === 'attached' ? repository.head.branch : null;
}

/** Returns `null` while the current branch is unborn (no commit yet). */
export function getHeadCommitHash(repository: Repository): Hash | null {
  const { head } = repository;
  if (head.type === 'detached') {
    return head.commit;
  }
  return findBranch(repository, head.branch) ?? null;
}

export function getHeadTree(repository: Repository): Tree {
  const hash = getHeadCommitHash(repository);
  return hash === null ? EMPTY_TREE : getCommit(repository, hash).tree;
}

export function addCommit(repository: Repository, commit: Commit): Repository {
  return { ...repository, commits: { ...repository.commits, [commit.hash]: commit } };
}

export function setBranch(repository: Repository, name: BranchName, hash: Hash): Repository {
  return { ...repository, branches: { ...repository.branches, [name]: hash } };
}

export function deleteBranch(repository: Repository, name: BranchName): Repository {
  const branches = Object.fromEntries(
    Object.entries(repository.branches).filter(([branch]) => branch !== name),
  );
  return { ...repository, branches };
}

/** Moves whatever HEAD designates (the current branch, or HEAD itself when detached). */
export function advanceHead(repository: Repository, hash: Hash): Repository {
  const { head } = repository;
  if (head.type === 'detached') {
    return { ...repository, head: { type: 'detached', commit: hash } };
  }
  return setBranch(repository, head.branch, hash);
}
