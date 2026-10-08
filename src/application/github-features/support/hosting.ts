import { findProject, type HostedProject } from '@/domain/entities/GitHub';
import { findHostedRepository } from '@/domain/entities/Network';
import type { Repository } from '@/domain/entities/Repository';
import { GitHubRuleError } from '@/domain/errors/GitHubErrors';
import type { Identity } from '@/domain/value-objects/Identity';

import type { HostingState } from '../HostingState';

/** The identity GitHub signs the commits it creates with, as the committer. */
export const GITHUB_IDENTITY: Identity = { name: 'GitHub', email: 'noreply@github.com' };

export function requireProject(state: HostingState, url: string): HostedProject {
  const project = findProject(state.github, url);
  if (project === undefined) {
    throw new GitHubRuleError('repositoryNotFound', { url });
  }
  return project;
}

export function requireRepositoryData(state: HostingState, url: string): Repository {
  const repository = findHostedRepository(state.network, url);
  if (repository === undefined) {
    throw new GitHubRuleError('repositoryNotFound', { url });
  }
  return repository;
}

export function requireOwner(project: HostedProject, actorId: string): void {
  if (project.owner !== actorId) {
    throw new GitHubRuleError('notOwner', { owner: project.owner });
  }
}
