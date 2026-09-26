import type { BranchName } from '../value-objects/BranchName';
import type { Hash } from '../value-objects/Hash';

/** HEAD either points to a branch (attached) or directly to a commit (detached). */
export type Head =
  | { readonly type: 'attached'; readonly branch: BranchName }
  | { readonly type: 'detached'; readonly commit: Hash };

export function attachedHead(branch: BranchName): Head {
  return { type: 'attached', branch };
}

export function detachedHead(commit: Hash): Head {
  return { type: 'detached', commit };
}
