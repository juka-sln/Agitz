import { storeHostedRepository, findBranchProtection } from '@/domain/entities/Network';
import { deleteBranch, findBranch } from '@/domain/entities/Repository';
import { GitHubRuleError } from '@/domain/errors/GitHubErrors';
import type { BranchName } from '@/domain/value-objects/BranchName';

import type { HostingState } from './HostingState';
import { requireRepositoryData } from './support/hosting';

export interface DeleteBranchInput {
  readonly repository: string;
  readonly branch: BranchName;
}

/** The "Delete branch" button shown once a pull request is merged. */
export class DeleteBranch {
  execute(state: HostingState, { repository: url, branch }: DeleteBranchInput): HostingState {
    const repository = requireRepositoryData(state, url);
    if (findBranch(repository, branch) === undefined) {
      throw new GitHubRuleError('branchNotFound');
    }
    if (repository.head.type === 'attached' && repository.head.branch === branch) {
      throw new GitHubRuleError('cannotDeleteDefaultBranch', { branch });
    }
    if (findBranchProtection(state.network, url, branch) !== undefined) {
      throw new GitHubRuleError('cannotDeleteProtectedBranch', { branch });
    }
    return {
      ...state,
      network: storeHostedRepository(state.network, url, deleteBranch(repository, branch)),
    };
  }
}
