import { DEFAULT_INITIAL_BRANCH, createEmptyRepository, type Repository } from './Repository';

/**
 * What a workstation reaches over the (simulated) network: the bare repositories hosted on
 * the virtual GitHub, by canonical URL.
 */
export interface Network {
  readonly repositories: Readonly<Record<string, Repository>>;
}

export const EMPTY_NETWORK: Network = { repositories: {} };

/** GitHub answers to `…/project`, `…/project.git` and `…/project.git/` alike. */
export function canonicalRepositoryUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('.git') ? trimmed : `${trimmed}.git`;
}

/** The URL Git prints in `From <url>` lines and merge messages, without the `.git` suffix. */
export function displayRepositoryUrl(url: string): string {
  return url.replace(/\/+$/, '').replace(/\.git$/, '');
}

/** The directory `git clone` creates: the last path segment, without `.git`. */
export function repositoryDirectoryName(url: string): string {
  return displayRepositoryUrl(url).split(/[/:]/).at(-1) ?? '';
}

export function hostedRepositoryUrls(network: Network): string[] {
  return Object.keys(network.repositories).sort();
}

export function findHostedRepository(network: Network, url: string): Repository | undefined {
  const key = canonicalRepositoryUrl(url);
  return Object.hasOwn(network.repositories, key) ? network.repositories[key] : undefined;
}

export function storeHostedRepository(
  network: Network,
  url: string,
  repository: Repository,
): Network {
  return {
    ...network,
    repositories: { ...network.repositories, [canonicalRepositoryUrl(url)]: repository },
  };
}

/** A new, empty repository on the server, like the one GitHub creates from its web form. */
export function createHostedRepository(network: Network, url: string): Network {
  return storeHostedRepository(network, url, createEmptyRepository(DEFAULT_INITIAL_BRANCH));
}
