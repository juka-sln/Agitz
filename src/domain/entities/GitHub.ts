import type { Issue } from './Issue';
import { canonicalRepositoryUrl } from './Network';
import type { PullRequest } from './PullRequest';
import type { WorkflowRun } from './WorkflowRun';

export const GITHUB_HOST = 'https://github.com';

/** What GitHub knows about a hosted repository besides its Git data. */
export interface HostedProject {
  /** Canonical URL, the key of the repository in the network. */
  readonly url: string;
  /** Login of the account that owns it. */
  readonly owner: string;
  readonly name: string;
  /** Canonical URL of the repository it was forked from, `null` for an original. */
  readonly parent: string | null;
}

/** The web side of the virtual GitHub: everything that is not stored in Git itself. */
export interface GitHub {
  readonly projects: Readonly<Record<string, HostedProject>>;
  readonly pullRequests: readonly PullRequest[];
  readonly issues: readonly Issue[];
  readonly workflowRuns: readonly WorkflowRun[];
}

export const EMPTY_GITHUB: GitHub = {
  projects: {},
  pullRequests: [],
  issues: [],
  workflowRuns: [],
};

export const REPOSITORY_NAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export function repositoryUrl(owner: string, name: string): string {
  return `${GITHUB_HOST}/${owner}/${name}.git`;
}

/** `owner/name`, the way GitHub titles a repository. */
export function projectFullName(project: HostedProject): string {
  return `${project.owner}/${project.name}`;
}

export function findProject(github: GitHub, url: string): HostedProject | undefined {
  const key = canonicalRepositoryUrl(url);
  return Object.hasOwn(github.projects, key) ? github.projects[key] : undefined;
}

export function addProject(github: GitHub, project: HostedProject): GitHub {
  return { ...github, projects: { ...github.projects, [project.url]: project } };
}

/** Pull requests and issues share one sequence of numbers per repository. */
export function nextItemNumber(github: GitHub, url: string): number {
  const numbers = [...github.pullRequests, ...github.issues]
    .filter((item) => item.repository === url)
    .map((item) => item.number);
  return Math.max(0, ...numbers) + 1;
}

export function findPullRequest(
  github: GitHub,
  url: string,
  number: number,
): PullRequest | undefined {
  return github.pullRequests.find(
    (pullRequest) => pullRequest.repository === url && pullRequest.number === number,
  );
}

export function findIssue(github: GitHub, url: string, number: number): Issue | undefined {
  return github.issues.find((issue) => issue.repository === url && issue.number === number);
}

export function replacePullRequest(github: GitHub, updated: PullRequest): GitHub {
  return {
    ...github,
    pullRequests: github.pullRequests.map((pullRequest) =>
      pullRequest.repository === updated.repository && pullRequest.number === updated.number
        ? updated
        : pullRequest,
    ),
  };
}

export function replaceIssue(github: GitHub, updated: Issue): GitHub {
  return {
    ...github,
    issues: github.issues.map((issue) =>
      issue.repository === updated.repository && issue.number === updated.number ? updated : issue,
    ),
  };
}
