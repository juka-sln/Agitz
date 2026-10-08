import type { BranchName } from '../value-objects/BranchName';
import type { Hash } from '../value-objects/Hash';

import type { SimulatedUser } from './SimulatedUser';

export type PullRequestState = 'open' | 'closed' | 'merged';

/** The three buttons of GitHub's merge box. */
export type MergeMethod = 'merge' | 'squash' | 'rebase';

export const MERGE_METHODS: readonly MergeMethod[] = ['merge', 'squash', 'rebase'];

export type ReviewVerdict = 'comment' | 'approve' | 'requestChanges';

/** Remarks a simulated reviewer can make, turned into sentences by the presentation layer. */
export type ReviewRemark =
  | { readonly kind: 'looksGood' }
  | { readonly kind: 'titleNotConventional'; readonly title: string }
  | { readonly kind: 'emptyDescription' }
  | { readonly kind: 'commitNotConventional'; readonly subject: string }
  | { readonly kind: 'conflictMarkers'; readonly path: string }
  | { readonly kind: 'checksFailing' };

export interface Review {
  readonly author: SimulatedUser;
  readonly verdict: ReviewVerdict;
  /** What the reviewer typed; empty for a review written by a simulated teammate. */
  readonly body: string;
  /** Remarks of a simulated teammate asked for a review. */
  readonly remarks: readonly ReviewRemark[];
}

export interface BranchLocation {
  /** Canonical URL of the repository holding the branch: the base one, or a fork. */
  readonly repository: string;
  readonly branch: BranchName;
}

export interface PullRequestMerge {
  readonly method: MergeMethod;
  readonly by: SimulatedUser;
  /** The commit the base branch points to after the merge. */
  readonly commit: Hash;
  /** The head branch tip that was merged, kept to list the commits once the branch is gone. */
  readonly headCommit: Hash;
  /** The base branch tip before the merge. */
  readonly baseCommit: Hash;
}

export interface PullRequest {
  /** Canonical URL of the repository the pull request targets. */
  readonly repository: string;
  readonly number: number;
  readonly title: string;
  readonly body: string;
  readonly author: SimulatedUser;
  /** The branch the changes are proposed for, in `repository`. */
  readonly base: BranchName;
  /** The branch holding the changes. */
  readonly head: BranchLocation;
  readonly state: PullRequestState;
  /** Reviews and comments, oldest first. */
  readonly reviews: readonly Review[];
  readonly merge: PullRequestMerge | null;
}

/**
 * Who currently approves the pull request: the latest approving or change-requesting review
 * of each reviewer counts, and authors cannot approve their own work.
 */
export function summarizeReviews(pullRequest: PullRequest): {
  readonly approvedBy: readonly string[];
  readonly changesRequestedBy: readonly string[];
} {
  const latest = new Map<string, ReviewVerdict>();
  for (const review of pullRequest.reviews) {
    if (review.verdict !== 'comment' && review.author.id !== pullRequest.author.id) {
      latest.set(review.author.id, review.verdict);
    }
  }
  const reviewers = [...latest.entries()];
  return {
    approvedBy: reviewers.filter(([, verdict]) => verdict === 'approve').map(([id]) => id),
    changesRequestedBy: reviewers
      .filter(([, verdict]) => verdict === 'requestChanges')
      .map(([id]) => id),
  };
}

const CLOSING_KEYWORDS = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b/gi;

/** Issues a pull request closes when merged, from `Closes #12`, `fixes #3`, `resolved #7`... */
export function findClosingReferences(text: string): number[] {
  return [...new Set([...text.matchAll(CLOSING_KEYWORDS)].map(([, number]) => Number(number)))];
}
