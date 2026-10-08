import type { BranchProtection } from './BranchProtection';
import { DEFAULT_INITIAL_BRANCH, createEmptyRepository, type Repository } from './Repository';

/**
 * What a workstation reaches over the (simulated) network: the bare repositories hosted on
 * the virtual GitHub, by canonical URL, and the rules the server enforces when receiving a push.
 */
export interface Network {
  readonly repositories: Readonly<Record<string, Repository>>;
  /** Canonical repository URL, then branch name, mapped to the rule protecting that branch. */
  readonly protections: Readonly<Record<string, Readonly<Record<string, BranchProtection>>>>;
}

export const EMPTY_NETWORK: Network = { repositories: {}, protections: {} };

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

export function findBranchProtection(
  network: Network,
  url: string,
  branch: string,
): BranchProtection | undefined {
  const rules = network.protections[canonicalRepositoryUrl(url)];
  return rules !== undefined && Object.hasOwn(rules, branch) ? rules[branch] : undefined;
}

/** Protects `branch`, or lifts its protection when `protection` is `null`. */
export function setBranchProtection(
  network: Network,
  url: string,
  branch: string,
  protection: BranchProtection | null,
): Network {
  const key = canonicalRepositoryUrl(url);
  const rules = new Map(Object.entries(network.protections[key] ?? {}));
  if (protection === null) {
    rules.delete(branch);
  } else {
    rules.set(branch, protection);
  }
  return { ...network, protections: { ...network.protections, [key]: Object.fromEntries(rules) } };
}
