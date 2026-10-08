import { findIssue, replaceIssue } from '@/domain/entities/GitHub';
import type { IssueState } from '@/domain/entities/Issue';
import { GitHubRuleError } from '@/domain/errors/GitHubErrors';

import { requireLabels } from './CreateIssue';
import type { HostingState } from './HostingState';

export interface UpdateIssueInput {
  readonly repository: string;
  readonly number: number;
  readonly state?: IssueState | undefined;
  readonly labels?: readonly string[] | undefined;
}

/** Closes or reopens an issue, or changes its labels. */
export class UpdateIssue {
  execute(state: HostingState, input: UpdateIssueInput): HostingState {
    const issue = findIssue(state.github, input.repository, input.number);
    if (issue === undefined) {
      throw new GitHubRuleError('issueNotFound', { number: input.number });
    }
    const nextState = input.state ?? issue.state;
    return {
      ...state,
      github: replaceIssue(state.github, {
        ...issue,
        state: nextState,
        labels: input.labels === undefined ? issue.labels : requireLabels(input.labels),
        closedByPullRequest: nextState === 'open' ? null : issue.closedByPullRequest,
      }),
    };
  }
}
