import { replacePullRequest } from '@/domain/entities/GitHub';
import type { PullRequest, ReviewRemark } from '@/domain/entities/PullRequest';
import { getBlobContent } from '@/domain/entities/Repository';
import type { SimulatedUser } from '@/domain/entities/SimulatedUser';
import { GitHubRuleError } from '@/domain/errors/GitHubErrors';
import { containsConflictMarkers } from '@/domain/services/lineMerge';
import { commitSubject } from '@/domain/value-objects/CommitMessage';
import { isConventionalHeader, isGeneratedHeader } from '@/domain/value-objects/ConventionalCommit';

import type { ObjectHasher } from '../ports/ObjectHasher';

import type { HostingState } from './HostingState';
import { getPullRequestStatus, type PullRequestStatus } from './support/comparePullRequest';
import { requireOpen, requirePullRequest, type PullRequestReference } from './support/pullRequests';

export interface RequestReviewInput extends PullRequestReference {
  /** The simulated teammate asked to review. */
  readonly reviewer: SimulatedUser;
}

const MAX_COMMIT_REMARKS = 3;

/** The points a careful teammate checks before approving, following the code review guide. */
function reviewRemarks(pullRequest: PullRequest, status: PullRequestStatus): ReviewRemark[] {
  const remarks: ReviewRemark[] = [];
  if (!isConventionalHeader(pullRequest.title)) {
    remarks.push({ kind: 'titleNotConventional', title: pullRequest.title });
  }
  if (pullRequest.body === '') {
    remarks.push({ kind: 'emptyDescription' });
  }
  const comparison = status.comparison;
  if (comparison !== null) {
    remarks.push(
      ...comparison.commits
        .map((commit) => commitSubject(commit.message))
        .filter((subject) => !isGeneratedHeader(subject) && !isConventionalHeader(subject))
        .slice(0, MAX_COMMIT_REMARKS)
        .map((subject) => ({ kind: 'commitNotConventional' as const, subject })),
    );
    for (const change of comparison.changes) {
      if (
        change.after !== null &&
        containsConflictMarkers(getBlobContent(comparison.repository, change.after))
      ) {
        remarks.push({ kind: 'conflictMarkers', path: change.path });
      }
    }
  }
  if (status.checks?.conclusion === 'failure') {
    remarks.push({ kind: 'checksFailing' });
  }
  return remarks;
}

/**
 * Asks a simulated teammate for a review: they read the pull request at once and either
 * approve it or request changes, explaining what to fix.
 */
export class RequestReview {
  private readonly hasher: ObjectHasher;

  constructor(hasher: ObjectHasher) {
    this.hasher = hasher;
  }

  execute(state: HostingState, input: RequestReviewInput): HostingState {
    const pullRequest = requirePullRequest(state, input);
    requireOpen(pullRequest);
    if (input.reviewer.id === pullRequest.author.id) {
      throw new GitHubRuleError('cannotApproveOwn');
    }
    const remarks = reviewRemarks(
      pullRequest,
      getPullRequestStatus(this.hasher, state, pullRequest),
    );
    return {
      ...state,
      github: replacePullRequest(state.github, {
        ...pullRequest,
        reviews: [
          ...pullRequest.reviews,
          {
            author: input.reviewer,
            verdict: remarks.length === 0 ? 'approve' : 'requestChanges',
            body: '',
            remarks: remarks.length === 0 ? [{ kind: 'looksGood' }] : remarks,
          },
        ],
      }),
    };
  }
}
