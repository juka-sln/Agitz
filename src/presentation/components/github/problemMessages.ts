import type { GitHubProblem } from '@/application/github-features/HostingState';

import type { MessageKey } from '../../i18n/messages';

type Translate = (key: MessageKey, params?: Readonly<Record<string, string | number>>) => string;

const PROBLEMS: Readonly<Record<string, MessageKey>> = {
  repositoryNotFound: 'github.problem.repositoryNotFound',
  notOwner: 'github.problem.notOwner',
  invalidRepositoryName: 'github.problem.invalidRepositoryName',
  repositoryExists: 'github.problem.repositoryExists',
  cannotForkOwnRepository: 'github.problem.cannotForkOwnRepository',
  alreadyForked: 'github.problem.alreadyForked',
  unrelatedRepositories: 'github.problem.unrelatedRepositories',
  titleRequired: 'github.problem.titleRequired',
  sameBranch: 'github.problem.sameBranch',
  branchNotFound: 'github.problem.branchNotFound',
  nothingToCompare: 'github.problem.nothingToCompare',
  pullRequestExists: 'github.problem.pullRequestExists',
  pullRequestNotFound: 'github.problem.pullRequestNotFound',
  pullRequestNotOpen: 'github.problem.pullRequestNotOpen',
  pullRequestNotClosed: 'github.problem.pullRequestNotClosed',
  cannotApproveOwn: 'github.problem.cannotApproveOwn',
  cannotRequestChangesOwn: 'github.problem.cannotRequestChangesOwn',
  reviewBodyRequired: 'github.problem.reviewBodyRequired',
  mergeBlocked: 'github.problem.mergeBlocked',
  cannotDeleteDefaultBranch: 'github.problem.cannotDeleteDefaultBranch',
  cannotDeleteProtectedBranch: 'github.problem.cannotDeleteProtectedBranch',
  invalidApprovalCount: 'github.problem.invalidApprovalCount',
  unknownLabel: 'github.problem.unknownLabel',
  issueNotFound: 'github.problem.issueNotFound',
};

export function problemMessage(t: Translate, problem: GitHubProblem): string {
  const key = PROBLEMS[problem.code];
  return key === undefined ? problem.code : t(key, problem.params);
}

export const PROBLEM_CODES = Object.keys(PROBLEMS);
