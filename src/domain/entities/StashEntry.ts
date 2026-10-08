import type { Hash } from '../value-objects/Hash';
import type { Timestamp } from '../value-objects/Timestamp';

import type { Tree } from './Tree';

/** Work set aside by `git stash`: the index and working tree as they were, and the commit they were based on. */
export interface StashEntry {
  readonly id: Hash;
  readonly message: string;
  readonly base: Hash;
  readonly index: Tree;
  /** Snapshot of the working tree files, untracked ones included only with `--include-untracked`. */
  readonly workingTree: Tree;
  readonly createdAt: Timestamp;
}
