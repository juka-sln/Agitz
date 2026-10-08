import type { Network } from '@/domain/entities/Network';
import { branchNames } from '@/domain/entities/Repository';
import type { Hash } from '@/domain/value-objects/Hash';

export interface HostedBranch {
  readonly name: string;
  readonly tip: Hash;
  readonly isDefault: boolean;
}

export interface HostedRepositorySummary {
  readonly url: string;
  /** The default branch first, then the others by name. */
  readonly branches: readonly HostedBranch[];
  readonly tags: readonly string[];
}

export function getHostedRepositories(network: Network): HostedRepositorySummary[] {
  return Object.entries(network.repositories)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([url, repository]) => {
      const defaultBranch = repository.head.type === 'attached' ? repository.head.branch : null;
      const branches = branchNames(repository).flatMap((name) => {
        const tip = repository.branches[name];
        return tip === undefined ? [] : [{ name, tip, isDefault: name === defaultBranch }];
      });
      return {
        url,
        branches: [
          ...branches.filter((branch) => branch.isDefault),
          ...branches.filter((branch) => !branch.isDefault),
        ],
        tags: Object.keys(repository.tags).sort(),
      };
    });
}
