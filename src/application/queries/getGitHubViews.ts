import type { BranchProtection } from '@/domain/entities/BranchProtection';
import { findProject, projectFullName, type HostedProject } from '@/domain/entities/GitHub';
import { findBranchProtection, findHostedRepository } from '@/domain/entities/Network';
import type { BranchLocation, PullRequest } from '@/domain/entities/PullRequest';
import {
  branchNames,
  getBlobContent,
  getCommit,
  type Repository,
} from '@/domain/entities/Repository';
import type { CheckConclusion } from '@/domain/entities/WorkflowRun';
import {
  collectReachableCommits,
  findMergeBase,
  listCommitsInLogOrder,
} from '@/domain/services/history';
import { diffLines, type LineOperation } from '@/domain/services/lineDiff';
import { diffTrees } from '@/domain/services/treeDiff';
import type { BranchName } from '@/domain/value-objects/BranchName';
import { commitSubject } from '@/domain/value-objects/CommitMessage';
import type { FileChangeType } from '@/domain/value-objects/FileChange';
import type { Hash } from '@/domain/value-objects/Hash';

import type { HostingState } from '../github-features/HostingState';
import { findLatestRun } from '../github-features/runWorkflows';
import {
  compareBranches,
  findMergeConflicts,
  treeOf,
  type PullRequestStatus,
} from '../github-features/support/comparePullRequest';
import type { ObjectHasher } from '../ports/ObjectHasher';

export interface ProjectSummary {
  readonly project: HostedProject;
  readonly fullName: string;
  /** `owner/name` of the repository it was forked from. */
  readonly parentFullName: string | null;
  readonly defaultBranch: string | null;
  readonly isEmpty: boolean;
  readonly openPullRequests: number;
  readonly openIssues: number;
}

function defaultBranchOf(repository: Repository | undefined): string | null {
  return repository?.head.type === 'attached' ? repository.head.branch : null;
}

export function getProjectSummary(state: HostingState, project: HostedProject): ProjectSummary {
  const repository = findHostedRepository(state.network, project.url);
  const parent = project.parent === null ? undefined : findProject(state.github, project.parent);
  return {
    project,
    fullName: projectFullName(project),
    parentFullName: parent === undefined ? null : projectFullName(parent),
    defaultBranch: defaultBranchOf(repository),
    isEmpty: repository === undefined || branchNames(repository).length === 0,
    openPullRequests: state.github.pullRequests.filter(
      (pullRequest) => pullRequest.repository === project.url && pullRequest.state === 'open',
    ).length,
    openIssues: state.github.issues.filter(
      (issue) => issue.repository === project.url && issue.state === 'open',
    ).length,
  };
}

export function getProjects(state: HostingState): ProjectSummary[] {
  return Object.values(state.github.projects)
    .map((project) => getProjectSummary(state, project))
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
}

export interface BranchSummary {
  readonly name: BranchName;
  readonly tip: Hash;
  readonly subject: string;
  readonly isDefault: boolean;
  readonly protection: BranchProtection | null;
  /** Result of the CI workflow on the tip, `null` when none ran. */
  readonly checks: CheckConclusion | null;
  /** The open pull request proposing this branch, if any. */
  readonly openPullRequest: number | null;
}

/** The default branch first, then the others by name. */
export function getRepositoryBranches(state: HostingState, url: string): BranchSummary[] {
  const repository = findHostedRepository(state.network, url);
  if (repository === undefined) {
    return [];
  }
  const defaultBranch = defaultBranchOf(repository);
  const branches = branchNames(repository).flatMap((name) => {
    const tip = repository.branches[name];
    if (tip === undefined) {
      return [];
    }
    return [
      {
        name,
        tip,
        subject: commitSubject(getCommit(repository, tip).message),
        isDefault: name === defaultBranch,
        protection: findBranchProtection(state.network, url, name) ?? null,
        checks: findLatestRun(state.github.workflowRuns, url, tip)?.conclusion ?? null,
        openPullRequest:
          state.github.pullRequests.find(
            (pullRequest) =>
              pullRequest.state === 'open' &&
              pullRequest.head.repository === url &&
              pullRequest.head.branch === name,
          )?.number ?? null,
      },
    ];
  });
  return [
    ...branches.filter((branch) => branch.isDefault),
    ...branches.filter((branch) => !branch.isDefault),
  ];
}

export interface ComparableRepository {
  readonly url: string;
  readonly fullName: string;
  readonly branches: readonly string[];
}

function comparable(state: HostingState, project: HostedProject): ComparableRepository {
  const repository = findHostedRepository(state.network, project.url);
  return {
    url: project.url,
    fullName: projectFullName(project),
    branches: repository === undefined ? [] : branchNames(repository),
  };
}

/** Where a pull request opened from `url` can go: the repository itself, or the one it was forked from. */
export function getBaseRepositories(state: HostingState, url: string): ComparableRepository[] {
  const project = findProject(state.github, url);
  if (project === undefined) {
    return [];
  }
  const parent = project.parent === null ? undefined : findProject(state.github, project.parent);
  return [project, ...(parent === undefined ? [] : [parent])].map((candidate) =>
    comparable(state, candidate),
  );
}

/** Where the changes of a pull request to `baseUrl` can come from: that repository and its forks. */
export function getHeadRepositories(state: HostingState, baseUrl: string): ComparableRepository[] {
  return Object.values(state.github.projects)
    .filter((project) => project.url === baseUrl || project.parent === baseUrl)
    .map((project) => comparable(state, project))
    .sort((left, right) =>
      left.url === baseUrl
        ? -1
        : right.url === baseUrl
          ? 1
          : left.fullName.localeCompare(right.fullName),
    );
}

export interface CommitSummary {
  readonly hash: Hash;
  readonly subject: string;
  readonly author: string;
}

export interface FileDiff {
  readonly path: string;
  readonly type: FileChangeType;
  readonly additions: number;
  readonly deletions: number;
  readonly lines: readonly LineOperation[];
}

export interface ChangeSummary {
  readonly commits: readonly CommitSummary[];
  readonly files: readonly FileDiff[];
}

/** Commits from `from` (excluded) to `to`, oldest first, and what they change from their merge base. */
export function describeChanges(
  repository: Repository,
  from: Hash,
  to: Hash,
  mergeBase: Hash | null,
): ChangeSummary {
  const excluded = collectReachableCommits(repository, [from]);
  const blob = (hash: Hash | null) => (hash === null ? '' : getBlobContent(repository, hash));
  return {
    commits: listCommitsInLogOrder(repository, [to])
      .filter((commit) => !excluded.has(commit.hash))
      .reverse()
      .map((commit) => ({
        hash: commit.hash,
        subject: commitSubject(commit.message),
        author: commit.author.name,
      })),
    files: diffTrees(treeOf(repository, mergeBase), treeOf(repository, to)).map((change) => {
      const lines = diffLines(blob(change.before), blob(change.after));
      return {
        path: change.path,
        type: change.type,
        additions: lines.filter((line) => line.type === 'added').length,
        deletions: lines.filter((line) => line.type === 'removed').length,
        lines,
      };
    }),
  };
}

/** The commits and files of a pull request, still known after its branch is merged and deleted. */
export function getPullRequestChanges(
  state: HostingState,
  pullRequest: PullRequest,
  status: PullRequestStatus,
): ChangeSummary | null {
  if (status.comparison !== null) {
    const { repository, baseTip, headTip, mergeBase } = status.comparison;
    return describeChanges(repository, baseTip, headTip, mergeBase);
  }
  const repository = findHostedRepository(state.network, pullRequest.repository);
  const merge = pullRequest.merge;
  if (repository === undefined || merge === null) {
    return null;
  }
  return describeChanges(
    repository,
    merge.baseCommit,
    merge.headCommit,
    findMergeBase(repository, merge.baseCommit, merge.headCommit),
  );
}

export interface PullRequestPreview extends ChangeSummary {
  /** Whether GitHub could merge the branches automatically, without conflicts. */
  readonly mergeable: boolean;
}

/** The "Comparing changes" page shown before a pull request is opened. */
export function previewPullRequest(
  hasher: ObjectHasher,
  state: HostingState,
  baseUrl: string,
  base: string,
  head: BranchLocation,
): PullRequestPreview | null {
  const comparison = compareBranches(state, baseUrl, base, head);
  if (comparison === null) {
    return null;
  }
  const { repository, baseTip, headTip, mergeBase } = comparison;
  return {
    ...describeChanges(repository, baseTip, headTip, mergeBase),
    mergeable: findMergeConflicts(hasher, comparison).length === 0,
  };
}
