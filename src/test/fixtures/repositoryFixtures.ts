import type { Commit } from '@/domain/entities/Commit';
import { attachedHead } from '@/domain/entities/Head';
import type { Repository } from '@/domain/entities/Repository';
import type { BranchName } from '@/domain/value-objects/BranchName';
import type { CommitMessage } from '@/domain/value-objects/CommitMessage';
import { toHash, type Hash } from '@/domain/value-objects/Hash';
import { fakeContentHash } from '@/test/doubles/FakeObjectHasher';

/** Builds a readable fake hash: `fakeHash('a1')` gives `a1a1a1...` (40 characters). */
export function fakeHash(seed: string): Hash {
  return toHash(seed.repeat(40).slice(0, 40));
}

export function blobHashFor(content: string): Hash {
  return fakeContentHash(`blob ${content}`);
}

export interface CommitSpec {
  readonly hash: Hash;
  readonly parents?: readonly Hash[];
  readonly files?: Readonly<Record<string, string>>;
  readonly time?: number;
  readonly message?: string;
}

export function buildRepository(
  commits: readonly CommitSpec[],
  branches: Readonly<Record<string, Hash>>,
  headBranch = 'main',
): Repository {
  const blobs: Record<string, string> = {};
  const commitObjects: Record<string, Commit> = {};

  commits.forEach((spec, position) => {
    const tree: Record<string, Hash> = {};
    for (const [path, content] of Object.entries(spec.files ?? {})) {
      const blob = blobHashFor(content);
      blobs[blob] = content;
      tree[path] = blob;
    }
    const identity = { name: 'Alice', email: 'alice@example.com' };
    const timestamp = { epochSeconds: spec.time ?? 1_000 + position, timezoneOffsetMinutes: 0 };
    commitObjects[spec.hash] = {
      hash: spec.hash,
      tree: tree,
      parents: spec.parents ?? [],
      message: (spec.message ?? `commit ${position}`) as CommitMessage,
      author: identity,
      authoredAt: timestamp,
      committer: identity,
      committedAt: timestamp,
    };
  });

  const head = attachedHead(headBranch as BranchName);
  const headCommit = head.type === 'attached' ? branches[head.branch] : undefined;
  return {
    commits: commitObjects,
    blobs,
    branches,
    head,
    index: headCommit ? (commitObjects[headCommit]?.tree ?? {}) : {},
  };
}
