/** A branch protection rule, as set in a GitHub repository's settings. */
export interface BranchProtection {
  /** Changes reach the branch only by merging a pull request: direct pushes are refused. */
  readonly requirePullRequest: boolean;
  /** Approving reviews a pull request needs before it can be merged. */
  readonly requiredApprovals: number;
  /** The CI workflow must have passed on the last commit before the branch accepts it. */
  readonly requireStatusChecks: boolean;
}

export const DEFAULT_BRANCH_PROTECTION: BranchProtection = {
  requirePullRequest: true,
  requiredApprovals: 1,
  requireStatusChecks: false,
};

/** Name of the status check the simulated CI workflow reports. */
export const CI_CHECK_NAME = 'ci';

export type ProtectedPushViolation = 'delete' | 'forcePush' | 'pullRequest' | 'statusCheck';

/**
 * Why a protected branch refuses a direct update, in the order GitHub checks it.
 * Deleting it or rewriting its history is never allowed, whatever the rule says.
 */
export function findProtectedPushViolation(
  protection: BranchProtection,
  update: { readonly deletes: boolean; readonly fastForward: boolean },
): ProtectedPushViolation | null {
  if (update.deletes) {
    return 'delete';
  }
  if (!update.fastForward) {
    return 'forcePush';
  }
  if (protection.requirePullRequest) {
    return 'pullRequest';
  }
  return protection.requireStatusChecks ? 'statusCheck' : null;
}
