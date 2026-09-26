import type { CommitMessage } from '../value-objects/CommitMessage';
import type { Hash } from '../value-objects/Hash';
import type { Identity } from '../value-objects/Identity';
import type { Timestamp } from '../value-objects/Timestamp';

import type { Tree } from './Tree';

export interface Commit {
  readonly hash: Hash;
  readonly tree: Tree;
  readonly parents: readonly Hash[];
  readonly message: CommitMessage;
  readonly author: Identity;
  readonly authoredAt: Timestamp;
  readonly committer: Identity;
  readonly committedAt: Timestamp;
}
