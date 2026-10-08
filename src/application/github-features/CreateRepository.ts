import {
  addProject,
  findProject,
  REPOSITORY_NAME_PATTERN,
  repositoryUrl,
} from '@/domain/entities/GitHub';
import { createHostedRepository } from '@/domain/entities/Network';
import type { SimulatedUser } from '@/domain/entities/SimulatedUser';
import { GitHubRuleError } from '@/domain/errors/GitHubErrors';

import type { HostingState } from './HostingState';

export interface CreateRepositoryInput {
  readonly owner: SimulatedUser;
  readonly name: string;
}

/** The "New repository" form: an empty repository, ready to receive a first push. */
export class CreateRepository {
  execute(state: HostingState, { owner, name }: CreateRepositoryInput): HostingState {
    const trimmed = name.trim();
    if (!REPOSITORY_NAME_PATTERN.test(trimmed) || trimmed === '.' || trimmed === '..') {
      throw new GitHubRuleError('invalidRepositoryName', { name: trimmed });
    }
    const url = repositoryUrl(owner.id, trimmed);
    if (findProject(state.github, url) !== undefined) {
      throw new GitHubRuleError('repositoryExists', { name: `${owner.id}/${trimmed}` });
    }
    return {
      network: createHostedRepository(state.network, url),
      github: addProject(state.github, { url, owner: owner.id, name: trimmed, parent: null }),
    };
  }
}
