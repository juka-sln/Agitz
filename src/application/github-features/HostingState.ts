import type { GitHub } from '@/domain/entities/GitHub';
import type { Network } from '@/domain/entities/Network';
import { GitHubRuleError, type GitHubProblemParams } from '@/domain/errors/GitHubErrors';

import { runWorkflows } from './runWorkflows';

/** The whole virtual GitHub: Git data reachable over the network, and the web features around it. */
export interface HostingState {
  readonly network: Network;
  readonly github: GitHub;
}

export interface GitHubProblem {
  readonly code: string;
  readonly params: GitHubProblemParams;
}

export type GitHubActionResult =
  | { readonly ok: true; readonly state: HostingState }
  | { readonly ok: false; readonly problem: GitHubProblem };

/**
 * Runs an action of the web interface. A refusal becomes a problem to display, and branches
 * the action moved trigger the CI workflow, exactly as a push would.
 */
export function runGitHubAction(
  state: HostingState,
  action: (state: HostingState) => HostingState,
): GitHubActionResult {
  try {
    const next = action(state);
    return { ok: true, state: runWorkflows(next, state.network) };
  } catch (error) {
    if (error instanceof GitHubRuleError) {
      return { ok: false, problem: { code: error.code, params: error.params } };
    }
    throw error;
  }
}
