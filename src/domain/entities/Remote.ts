import type { BranchName } from '../value-objects/BranchName';

/** A named URL pointing to another copy of the repository (`origin`, `upstream`...). */
export interface Remote {
  readonly url: string;
}

/** The remote branch a local branch follows: what `git pull` and `git push` use by default. */
export interface Upstream {
  readonly remote: string;
  readonly branch: BranchName;
}

/** Name of the remote-tracking branch that mirrors `branch` on `remote`, e.g. `origin/main`. */
export function remoteTrackingName(remote: string, branch: string): string {
  return `${remote}/${branch}`;
}

export function upstreamName(upstream: Upstream): string {
  return remoteTrackingName(upstream.remote, upstream.branch);
}
