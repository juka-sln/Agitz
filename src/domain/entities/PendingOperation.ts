import type { BranchName } from '../value-objects/BranchName';
import type { Hash } from '../value-objects/Hash';

/** A merge that stopped on conflicts, waiting for `git commit` or `git merge --abort`. */
export interface PendingMerge {
  readonly type: 'merge';
  readonly theirs: Hash;
  readonly message: string;
  readonly origHead: Hash;
}

/**
 * Operations replaying commits one by one (cherry-pick, revert, rebase).
 * They stop on a conflict, then resume with `--continue`, `--skip` or `--abort`.
 */
export interface PendingSequence {
  readonly type: 'cherry-pick' | 'revert' | 'rebase';
  /** The commit being applied when the operation stopped. */
  readonly current: Hash;
  readonly todo: readonly Hash[];
  readonly origHead: Hash;
  /** Branch to move back onto when a rebase finishes or aborts; null when started detached. */
  readonly branch: BranchName | null;
  /** Rebase only: the commit the replayed commits are placed onto. */
  readonly onto: Hash | null;
  readonly total: number;
}

export type PendingOperation = PendingMerge | PendingSequence;
