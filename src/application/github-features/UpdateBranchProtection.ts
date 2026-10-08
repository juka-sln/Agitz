import type { BranchProtection } from '@/domain/entities/BranchProtection';
import { setBranchProtection } from '@/domain/entities/Network';
import { findBranch } from '@/domain/entities/Repository';
import type { SimulatedUser } from '@/domain/entities/SimulatedUser';
import { GitHubRuleError } from '@/domain/errors/GitHubErrors';

import type { HostingState } from './HostingState';
import { requireOwner, requireProject, requireRepositoryData } from './support/hosting';

export interface UpdateBranchProtectionInput {
  readonly repository: string;
  readonly branch: string;
  /** `null` removes the rule. */
  readonly protection: BranchProtection | null;
  readonly actor: SimulatedUser;
}

const MAX_REQUIRED_APPROVALS = 6;

/** Repository settings, Branches: only the owner may add, change or remove a rule. */
export class UpdateBranchProtection {
  execute(state: HostingState, input: UpdateBranchProtectionInput): HostingState {
    const project = requireProject(state, input.repository);
    requireOwner(project, input.actor.id);
    if (findBranch(requireRepositoryData(state, project.url), input.branch) === undefined) {
      throw new GitHubRuleError('branchNotFound');
    }
    const approvals = input.protection?.requiredApprovals ?? 0;
    if (!Number.isInteger(approvals) || approvals < 0 || approvals > MAX_REQUIRED_APPROVALS) {
      throw new GitHubRuleError('invalidApprovalCount', { max: MAX_REQUIRED_APPROVALS });
    }
    return {
      ...state,
      network: setBranchProtection(state.network, project.url, input.branch, input.protection),
    };
  }
}
