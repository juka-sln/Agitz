import type { BranchName } from '../value-objects/BranchName';
import type { Hash } from '../value-objects/Hash';

import type { Commit } from './Commit';
import { attachedHead, type Head } from './Head';
import type { PendingOperation } from './PendingOperation';
import { remoteTrackingName, type Remote, type Upstream } from './Remote';
import type { StashEntry } from './StashEntry';
import type { Tag } from './Tag';
import { EMPTY_TREE, type Tree } from './Tree';
import type { UnmergedEntry } from './UnmergedEntry';

export const DEFAULT_INITIAL_BRANCH = 'main' as BranchName;

export interface Repository {
  readonly commits: Readonly<Record<string, Commit>>;
  readonly blobs: Readonly<Record<string, string>>;
  readonly branches: Readonly<Record<string, Hash>>;
  readonly tags: Readonly<Record<string, Tag>>;
  readonly head: Head;
  /** The staging area: the snapshot that the next commit will record. */
  readonly index: Tree;
  /** Conflicted paths, kept out of the index until resolved with `git add`. */
  readonly unmerged: Readonly<Record<string, UnmergedEntry>>;
  readonly operation: PendingOperation | null;
  /** Newest first: `stash@{0}` is the first entry. */
  readonly stash: readonly StashEntry[];
  readonly remotes: Readonly<Record<string, Remote>>;
  /** Remote-tracking branches such as `origin/main`: where each remote branch was at the last contact. */
  readonly remoteBranches: Readonly<Record<string, Hash>>;
  /** Local branch name mapped to the remote branch it tracks. */
  readonly upstreams: Readonly<Record<string, Upstream>>;
}

export function createEmptyRepository(initialBranch: BranchName): Repository {
  return {
    commits: {},
    blobs: {},
    branches: {},
    tags: {},
    head: attachedHead(initialBranch),
    index: EMPTY_TREE,
    unmerged: {},
    operation: null,
    stash: [],
    remotes: {},
    remoteBranches: {},
    upstreams: {},
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

export function hasUnmergedPaths(repository: Repository): boolean {
  return Object.keys(repository.unmerged).length > 0;
}

export function findTag(repository: Repository, name: string): Tag | undefined {
  return Object.hasOwn(repository.tags, name) ? repository.tags[name] : undefined;
}

function withoutKey<T>(record: Readonly<Record<string, T>>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([name]) => name !== key));
}

export function findRemote(repository: Repository, name: string): Remote | undefined {
  return Object.hasOwn(repository.remotes, name) ? repository.remotes[name] : undefined;
}

export function remoteNames(repository: Repository): string[] {
  return Object.keys(repository.remotes).sort();
}

export function findRemoteBranch(repository: Repository, name: string): Hash | undefined {
  return Object.hasOwn(repository.remoteBranches, name)
    ? repository.remoteBranches[name]
    : undefined;
}

/** Branch names (without the remote prefix) that `remote` had at the last contact. */
export function remoteBranchesOf(repository: Repository, remote: string): BranchName[] {
  const prefix = remoteTrackingName(remote, '');
  return Object.keys(repository.remoteBranches)
    .filter((name) => name.startsWith(prefix))
    .map((name) => name.slice(prefix.length) as BranchName)
    .sort();
}

export function setRemoteBranch(repository: Repository, name: string, hash: Hash): Repository {
  return { ...repository, remoteBranches: { ...repository.remoteBranches, [name]: hash } };
}

export function deleteRemoteBranch(repository: Repository, name: string): Repository {
  return { ...repository, remoteBranches: withoutKey(repository.remoteBranches, name) };
}

export function findUpstream(repository: Repository, branch: string): Upstream | undefined {
  return Object.hasOwn(repository.upstreams, branch) ? repository.upstreams[branch] : undefined;
}

export function setUpstream(
  repository: Repository,
  branch: BranchName,
  upstream: Upstream,
): Repository {
  return { ...repository, upstreams: { ...repository.upstreams, [branch]: upstream } };
}

export function unsetUpstream(repository: Repository, branch: string): Repository {
  return { ...repository, upstreams: withoutKey(repository.upstreams, branch) };
}

export function setTag(repository: Repository, name: string, tag: Tag): Repository {
  return { ...repository, tags: { ...repository.tags, [name]: tag } };
}

export function deleteTag(repository: Repository, name: string): Repository {
  return { ...repository, tags: withoutKey(repository.tags, name) };
}
