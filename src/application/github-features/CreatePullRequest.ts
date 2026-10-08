import { nextItemNumber } from '@/domain/entities/GitHub';
import type { BranchLocation, PullRequest } from '@/domain/entities/PullRequest';
import type { SimulatedUser } from '@/domain/entities/SimulatedUser';
import { GitHubRuleError } from '@/domain/errors/GitHubErrors';
import type { BranchName } from '@/domain/value-objects/BranchName';

import type { HostingState } from './HostingState';
import { compareBranches } from './support/comparePullRequest';
import { requireProject } from './support/hosting';

export interface CreatePullRequestInput {
  /** Canonical URL of the repository the changes are proposed to. */
  readonly repository: string;
  readonly base: BranchName;
  readonly head: BranchLocation;
  readonly title: string;
  readonly body: string;
  readonly author: SimulatedUser;
}

/** Proposes to merge a branch, of the same repository or of a fork, into a base branch. */
export class CreatePullRequest {
  execute(state: HostingState, input: CreatePullRequestInput): HostingState {
    const base = requireProject(state, input.repository);
    const head = requireProject(state, input.head.repository);
    if (head.url !== base.url && head.parent !== base.url) {
      throw new GitHubRuleError('unrelatedRepositories');
    }
    const title = input.title.trim();
    if (title === '') {
      throw new GitHubRuleError('titleRequired');
    }
    if (head.url === base.url && input.head.branch === input.base) {
      throw new GitHubRuleError('sameBranch');
    }
    const comparison = compareBranches(state, base.url, input.base, input.head);
    if (comparison === null) {
      throw new GitHubRuleError('branchNotFound');
    }
    if (comparison.commits.length === 0) {
      throw new GitHubRuleError('nothingToCompare', {
        base: input.base,
        head: input.head.branch,
      });
    }
    const duplicate = state.github.pullRequests.find(
      (pullRequest) =>
        pullRequest.state === 'open' &&
        pullRequest.repository === base.url &&
        pullRequest.base === input.base &&
        pullRequest.head.repository === head.url &&
        pullRequest.head.branch === input.head.branch,
    );
    if (duplicate !== undefined) {
      throw new GitHubRuleError('pullRequestExists', { number: duplicate.number });
    }

    const pullRequest: PullRequest = {
      repository: base.url,
      number: nextItemNumber(state.github, base.url),
      title,
      body: input.body.trim(),
      author: input.author,
      base: input.base,
      head: { repository: head.url, branch: input.head.branch },
      state: 'open',
      reviews: [],
      merge: null,
    };
    return {
      ...state,
      github: { ...state.github, pullRequests: [...state.github.pullRequests, pullRequest] },
    };
  }
}
