import { addProject, findProject, projectFullName, repositoryUrl } from '@/domain/entities/GitHub';
import { storeHostedRepository } from '@/domain/entities/Network';
import {
  createEmptyRepository,
  DEFAULT_INITIAL_BRANCH,
  type Repository,
} from '@/domain/entities/Repository';
import type { SimulatedUser } from '@/domain/entities/SimulatedUser';
import { GitHubRuleError } from '@/domain/errors/GitHubErrors';

import type { HostingState } from './HostingState';
import { requireProject, requireRepositoryData } from './support/hosting';

export interface ForkRepositoryInput {
  readonly url: string;
  readonly owner: SimulatedUser;
}

/** A server-side copy of the repository under another account, with the same history. */
function copyForFork(source: Repository): Repository {
  return {
    ...createEmptyRepository(DEFAULT_INITIAL_BRANCH),
    commits: source.commits,
    blobs: source.blobs,
    branches: source.branches,
    tags: source.tags,
    head: source.head,
  };
}

/**
 * Forks a repository: the new owner can push to the copy freely, then propose the changes
 * back to the original with a pull request. Protection rules, issues and pull requests stay behind.
 */
export class ForkRepository {
  execute(state: HostingState, { url, owner }: ForkRepositoryInput): HostingState {
    const source = requireProject(state, url);
    if (source.owner === owner.id) {
      throw new GitHubRuleError('cannotForkOwnRepository');
    }
    const forkUrl = repositoryUrl(owner.id, source.name);
    const existing = findProject(state.github, forkUrl);
    if (existing !== undefined) {
      throw new GitHubRuleError(
        existing.parent === source.url ? 'alreadyForked' : 'repositoryExists',
        { name: projectFullName(existing) },
      );
    }
    return {
      network: storeHostedRepository(
        state.network,
        forkUrl,
        copyForFork(requireRepositoryData(state, source.url)),
      ),
      github: addProject(state.github, {
        url: forkUrl,
        owner: owner.id,
        name: source.name,
        parent: source.url,
      }),
    };
  }
}
