import { findPullRequest } from '@/domain/entities/GitHub';
import type { PullRequest } from '@/domain/entities/PullRequest';
import { GitHubRuleError } from '@/domain/errors/GitHubErrors';

import type { HostingState } from '../HostingState';

export interface PullRequestReference {
  /** Canonical URL of the base repository. */
  readonly repository: string;
  readonly number: number;
}

export function requirePullRequest(
  state: HostingState,
  { repository, number }: PullRequestReference,
): PullRequest {
  const pullRequest = findPullRequest(state.github, repository, number);
  if (pullRequest === undefined) {
    throw new GitHubRuleError('pullRequestNotFound', { number });
  }
  return pullRequest;
}

export function requireOpen(pullRequest: PullRequest): void {
  if (pullRequest.state !== 'open') {
    throw new GitHubRuleError('pullRequestNotOpen', { number: pullRequest.number });
  }
}
