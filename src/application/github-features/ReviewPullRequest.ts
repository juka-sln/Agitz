import { replacePullRequest } from '@/domain/entities/GitHub';
import type { Review, ReviewVerdict } from '@/domain/entities/PullRequest';
import type { SimulatedUser } from '@/domain/entities/SimulatedUser';
import { GitHubRuleError } from '@/domain/errors/GitHubErrors';

import type { HostingState } from './HostingState';
import { requireOpen, requirePullRequest, type PullRequestReference } from './support/pullRequests';

export interface ReviewPullRequestInput extends PullRequestReference {
  readonly reviewer: SimulatedUser;
  readonly verdict: ReviewVerdict;
  readonly body: string;
}

/** Comments on a pull request, approves it or asks for changes. */
export class ReviewPullRequest {
  execute(state: HostingState, input: ReviewPullRequestInput): HostingState {
    const pullRequest = requirePullRequest(state, input);
    requireOpen(pullRequest);
    const body = input.body.trim();
    if (input.verdict !== 'comment' && input.reviewer.id === pullRequest.author.id) {
      throw new GitHubRuleError(
        input.verdict === 'approve' ? 'cannotApproveOwn' : 'cannotRequestChangesOwn',
      );
    }
    if (body === '' && input.verdict !== 'approve') {
      throw new GitHubRuleError('reviewBodyRequired');
    }
    const review: Review = { author: input.reviewer, verdict: input.verdict, body, remarks: [] };
    return {
      ...state,
      github: replacePullRequest(state.github, {
        ...pullRequest,
        reviews: [...pullRequest.reviews, review],
      }),
    };
  }
}
