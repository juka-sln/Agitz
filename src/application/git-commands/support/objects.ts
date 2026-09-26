import type { Commit } from '@/domain/entities/Commit';
import { getBlobContent, type Repository } from '@/domain/entities/Repository';
import { treePaths, type Tree } from '@/domain/entities/Tree';
import type { WorkingTree } from '@/domain/entities/Workspace';
import type { CommitMessage } from '@/domain/value-objects/CommitMessage';
import type { Hash } from '@/domain/value-objects/Hash';
import { formatIdentity, type Identity } from '@/domain/value-objects/Identity';
import { formatTimezoneOffset, type Timestamp } from '@/domain/value-objects/Timestamp';

import type { ObjectHasher } from '../../ports/ObjectHasher';

type ObjectType = 'blob' | 'tree' | 'commit';

const encoder = new TextEncoder();

/** Serializes an object the way Git does before hashing it: `<type> <byte length>\0<body>`. */
function hashObject(hasher: ObjectHasher, type: ObjectType, body: string): Hash {
  return hasher.hash(`${type} ${encoder.encode(body).length}\0${body}`);
}

export function hashBlob(hasher: ObjectHasher, content: string): Hash {
  return hashObject(hasher, 'blob', content);
}

/** Simplified tree serialization: the real format nests one tree object per directory. */
export function hashTree(hasher: ObjectHasher, tree: Tree): Hash {
  const body = treePaths(tree)
    .map((path) => `100644 blob ${tree[path] ?? ''}\t${path}\n`)
    .join('');
  return hashObject(hasher, 'tree', body);
}

export function storeBlob(
  hasher: ObjectHasher,
  repository: Repository,
  content: string,
): { readonly repository: Repository; readonly hash: Hash } {
  const hash = hashBlob(hasher, content);
  if (Object.hasOwn(repository.blobs, hash)) {
    return { repository, hash };
  }
  return { repository: { ...repository, blobs: { ...repository.blobs, [hash]: content } }, hash };
}

/** Copies the working tree version of a path into the index, or removes it when deleted. */
export function stageWorkingTreePath(
  hasher: ObjectHasher,
  repository: Repository,
  files: WorkingTree,
  path: string,
): Repository {
  const content = files[path];
  if (content === undefined) {
    const index = Object.fromEntries(
      Object.entries(repository.index).filter(([indexedPath]) => indexedPath !== path),
    );
    return { ...repository, index };
  }
  const stored = storeBlob(hasher, repository, content);
  return { ...stored.repository, index: { ...stored.repository.index, [path]: stored.hash } };
}

export function blobContentOrEmpty(repository: Repository, hash: Hash | null): string {
  return hash === null ? '' : getBlobContent(repository, hash);
}

export interface CommitDraft {
  readonly tree: Tree;
  readonly parents: readonly Hash[];
  readonly message: CommitMessage;
  readonly author: Identity;
  readonly timestamp: Timestamp;
}

export function createCommitObject(hasher: ObjectHasher, draft: CommitDraft): Commit {
  const signature = `${formatIdentity(draft.author)} ${draft.timestamp.epochSeconds} ${formatTimezoneOffset(draft.timestamp.timezoneOffsetMinutes)}`;
  const body = [
    `tree ${hashTree(hasher, draft.tree)}`,
    ...draft.parents.map((parent) => `parent ${parent}`),
    `author ${signature}`,
    `committer ${signature}`,
    '',
    `${draft.message}\n`,
  ].join('\n');

  return {
    hash: hashObject(hasher, 'commit', body),
    tree: draft.tree,
    parents: draft.parents,
    message: draft.message,
    author: draft.author,
    authoredAt: draft.timestamp,
    committer: draft.author,
    committedAt: draft.timestamp,
  };
}
