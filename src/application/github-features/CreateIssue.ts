import { nextItemNumber } from '@/domain/entities/GitHub';
import { isLabel, type Issue } from '@/domain/entities/Issue';
import type { SimulatedUser } from '@/domain/entities/SimulatedUser';
import { GitHubRuleError } from '@/domain/errors/GitHubErrors';

import type { HostingState } from './HostingState';
import { requireProject } from './support/hosting';

export interface CreateIssueInput {
  readonly repository: string;
  readonly title: string;
  readonly body: string;
  readonly labels: readonly string[];
  readonly author: SimulatedUser;
}

export function requireLabels(labels: readonly string[]): string[] {
  const unknown = labels.find((label) => !isLabel(label));
  if (unknown !== undefined) {
    throw new GitHubRuleError('unknownLabel', { label: unknown });
  }
  return [...new Set(labels)].sort();
}

/** Reports a bug or proposes an idea, before anyone writes code for it. */
export class CreateIssue {
  execute(state: HostingState, input: CreateIssueInput): HostingState {
    const project = requireProject(state, input.repository);
    const title = input.title.trim();
    if (title === '') {
      throw new GitHubRuleError('titleRequired');
    }
    const issue: Issue = {
      repository: project.url,
      number: nextItemNumber(state.github, project.url),
      title,
      body: input.body.trim(),
      author: input.author,
      labels: requireLabels(input.labels),
      state: 'open',
      closedByPullRequest: null,
    };
    return { ...state, github: { ...state.github, issues: [...state.github.issues, issue] } };
  }
}
