import type { BranchLocation, PullRequest } from '@/domain/entities/PullRequest';

import type { GitCommandContext } from '../git-commands/GitCommand';
import { previewPullRequest, type PullRequestPreview } from '../queries/getGitHubViews';

import { ClosePullRequest } from './ClosePullRequest';
import { CreateIssue } from './CreateIssue';
import { CreatePullRequest } from './CreatePullRequest';
import { CreateRepository } from './CreateRepository';
import { DeleteBranch } from './DeleteBranch';
import { ForkRepository } from './ForkRepository';
import type { HostingState } from './HostingState';
import { MergePullRequest } from './MergePullRequest';
import { RequestReview } from './RequestReview';
import { ReviewPullRequest } from './ReviewPullRequest';
import { getPullRequestStatus, type PullRequestStatus } from './support/comparePullRequest';
import { UpdateBranchProtection } from './UpdateBranchProtection';
import { UpdateIssue } from './UpdateIssue';

/** Every action of the virtual GitHub's web interface, sharing the engine's hasher and clock. */
export function createGitHubActions(context: GitCommandContext) {
  return {
    createRepository: new CreateRepository(),
    forkRepository: new ForkRepository(),
    createPullRequest: new CreatePullRequest(),
    reviewPullRequest: new ReviewPullRequest(),
    requestReview: new RequestReview(context.hasher),
    mergePullRequest: new MergePullRequest(context),
    closePullRequest: new ClosePullRequest(),
    deleteBranch: new DeleteBranch(),
    updateBranchProtection: new UpdateBranchProtection(),
    createIssue: new CreateIssue(),
    updateIssue: new UpdateIssue(),
    pullRequestStatus: (state: HostingState, pullRequest: PullRequest): PullRequestStatus =>
      getPullRequestStatus(context.hasher, state, pullRequest),
    previewPullRequest: (
      state: HostingState,
      baseUrl: string,
      base: string,
      head: BranchLocation,
    ): PullRequestPreview | null => previewPullRequest(context.hasher, state, baseUrl, base, head),
  } as const;
}

export type GitHubActions = ReturnType<typeof createGitHubActions>;
