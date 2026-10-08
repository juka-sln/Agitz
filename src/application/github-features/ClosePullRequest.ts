import { replacePullRequest } from '@/domain/entities/GitHub';
import { GitHubRuleError } from '@/domain/errors/GitHubErrors';

import type { HostingState } from './HostingState';
import { compareBranches } from './support/comparePullRequest';
import { requirePullRequest, type PullRequestReference } from './support/pullRequests';

export interface ClosePullRequestInput extends PullRequestReference {
  /** `true` reopens a closed pull request instead. */
  readonly reopen?: boolean | undefined;
}

/** Closes a pull request without merging it, or reopens it while its branch still exists. */
export class ClosePullRequest {
  execute(state: HostingState, input: ClosePullRequestInput): HostingState {
    const pullRequest = requirePullRequest(state, input);
    const reopen = input.reopen === true;
    if (pullRequest.state !== (reopen ? 'closed' : 'open')) {
      throw new GitHubRuleError(reopen ? 'pullRequestNotClosed' : 'pullRequestNotOpen', {
        number: pullRequest.number,
      });
    }
    if (
      reopen &&
      compareBranches(state, pullRequest.repository, pullRequest.base, pullRequest.head) === null
    ) {
      throw new GitHubRuleError('branchNotFound');
    }
    return {
      ...state,
      github: replacePullRequest(state.github, {
        ...pullRequest,
        state: reopen ? 'open' : 'closed',
      }),
    };
  }
}
