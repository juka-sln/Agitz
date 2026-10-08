import type { BranchName } from '../value-objects/BranchName';
import type { Hash } from '../value-objects/Hash';

export type CheckConclusion = 'success' | 'failure';

export type WorkflowJobName = 'commitlint' | 'build';

export type CheckProblem =
  | { readonly kind: 'commitNotConventional'; readonly commit: Hash; readonly subject: string }
  | { readonly kind: 'conflictMarkers'; readonly path: string };

export interface WorkflowJob {
  readonly name: WorkflowJobName;
  readonly conclusion: CheckConclusion;
  readonly problems: readonly CheckProblem[];
}

/** One run of the simulated CI workflow, triggered by a push to a branch. */
export interface WorkflowRun {
  readonly id: number;
  /** Canonical URL of the repository the push went to. */
  readonly repository: string;
  readonly branch: BranchName;
  readonly commit: Hash;
  readonly conclusion: CheckConclusion;
  readonly jobs: readonly WorkflowJob[];
}

/** GitHub Actions only runs workflows declared in this directory of the repository. */
export const WORKFLOW_DIRECTORY = '.github/workflows/';

export function isWorkflowFile(path: string): boolean {
  return path.startsWith(WORKFLOW_DIRECTORY) && /\.ya?ml$/.test(path);
}
