import type { Commit } from '@/domain/entities/Commit';
import { findHostedRepository, type Network } from '@/domain/entities/Network';
import { getBlobContent, getCommit, type Repository } from '@/domain/entities/Repository';
import {
  isWorkflowFile,
  type CheckProblem,
  type WorkflowJob,
  type WorkflowRun,
} from '@/domain/entities/WorkflowRun';
import { collectReachableCommits, listCommitsInLogOrder } from '@/domain/services/history';
import { containsConflictMarkers } from '@/domain/services/lineMerge';
import type { BranchName } from '@/domain/value-objects/BranchName';
import { commitSubject } from '@/domain/value-objects/CommitMessage';
import { isConventionalHeader, isGeneratedHeader } from '@/domain/value-objects/ConventionalCommit';
import type { Hash } from '@/domain/value-objects/Hash';

import type { HostingState } from './HostingState';

function job(name: WorkflowJob['name'], problems: readonly CheckProblem[]): WorkflowJob {
  return { name, conclusion: problems.length === 0 ? 'success' : 'failure', problems };
}

/** The commits a push brought to a branch: new on that branch, and new to the repository for a new branch. */
function pushedCommits(repository: Repository, tip: Hash, known: readonly Hash[]): Commit[] {
  const alreadyThere = collectReachableCommits(
    repository,
    known.filter((hash) => repository.commits[hash] !== undefined),
  );
  return listCommitsInLogOrder(repository, [tip]).filter(
    (commit) => !alreadyThere.has(commit.hash),
  );
}

/** commitlint: every new commit follows Conventional Commits. */
function lintCommits(commits: readonly Commit[]): CheckProblem[] {
  return commits.flatMap((commit) => {
    const subject = commitSubject(commit.message);
    return commit.parents.length > 1 || isGeneratedHeader(subject) || isConventionalHeader(subject)
      ? []
      : [{ kind: 'commitNotConventional' as const, commit: commit.hash, subject }];
  });
}

/** The build: a file still holding conflict markers would not even compile. */
function build(repository: Repository, commit: Commit): CheckProblem[] {
  return Object.entries(commit.tree)
    .filter(([, blob]) => containsConflictMarkers(getBlobContent(repository, blob)))
    .map(([path]) => ({ kind: 'conflictMarkers' as const, path }));
}

function runWorkflow(
  id: number,
  url: string,
  repository: Repository,
  branch: BranchName,
  tip: Hash,
  known: readonly Hash[],
): WorkflowRun {
  const commit = getCommit(repository, tip);
  const jobs = [
    job('commitlint', lintCommits(pushedCommits(repository, tip, known))),
    job('build', build(repository, commit)),
  ];
  return {
    id,
    repository: url,
    branch,
    commit: tip,
    conclusion: jobs.every((ran) => ran.conclusion === 'success') ? 'success' : 'failure',
    jobs,
  };
}

/**
 * Simulated GitHub Actions: each branch that moved since `previous` runs the CI workflow,
 * provided the commit declares one in `.github/workflows/`.
 */
export function runWorkflows(state: HostingState, previous: Network): HostingState {
  const runs: WorkflowRun[] = [];
  for (const [url, repository] of Object.entries(state.network.repositories)) {
    const before = findHostedRepository(previous, url);
    for (const [branch, tip] of Object.entries(repository.branches)) {
      const previousTip = before?.branches[branch];
      if (
        previousTip === tip ||
        !Object.keys(getCommit(repository, tip).tree).some(isWorkflowFile)
      ) {
        continue;
      }
      const known =
        previousTip === undefined ? Object.values(before?.branches ?? {}) : [previousTip];
      const id = state.github.workflowRuns.length + runs.length + 1;
      runs.push(runWorkflow(id, url, repository, branch as BranchName, tip, known));
    }
  }
  if (runs.length === 0) {
    return state;
  }
  return {
    ...state,
    github: { ...state.github, workflowRuns: [...state.github.workflowRuns, ...runs] },
  };
}

/** The latest CI result for a commit pushed to a repository, `null` when no workflow ran on it. */
export function findLatestRun(
  runs: readonly WorkflowRun[],
  url: string,
  commit: Hash,
): WorkflowRun | null {
  return runs.findLast((run) => run.repository === url && run.commit === commit) ?? null;
}
