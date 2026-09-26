import { getHeadCommitHash } from '@/domain/entities/Repository';
import type { Workspace } from '@/domain/entities/Workspace';
import { shortHash } from '@/domain/value-objects/Hash';

export interface PromptParts {
  readonly user: string;
  readonly directory: string;
  /** Branch name, short hash when detached, or null outside a repository. */
  readonly location: string | null;
  /** Operation waiting for the user, e.g. `MERGING` or `REBASE 1/3`, as shown by git-prompt. */
  readonly state: string | null;
}

function describeOperationState(workspace: Workspace): string | null {
  const operation = workspace.repository?.operation;
  switch (operation?.type) {
    case undefined:
      return null;
    case 'merge':
      return 'MERGING';
    case 'cherry-pick':
      return 'CHERRY-PICKING';
    case 'revert':
      return 'REVERTING';
    case 'rebase':
      return `REBASE ${operation.total - operation.todo.length}/${operation.total}`;
  }
}

/** The pieces of a git-aware prompt such as `alice@agitz ~/project (main) $`. */
export function describePrompt(workspace: Workspace): PromptParts {
  const user = workspace.identity.name.toLowerCase().replace(/\s+/g, '');
  const directory = `~/${workspace.path.split('/').filter(Boolean).at(-1) ?? ''}`;
  const { repository } = workspace;
  if (!repository) {
    return { user, directory, location: null, state: null };
  }
  const state = describeOperationState(workspace);
  const { head, operation } = repository;
  if (operation?.type === 'rebase' && operation.branch !== null) {
    return { user, directory, location: operation.branch, state };
  }
  if (head.type === 'attached') {
    return { user, directory, location: head.branch, state };
  }
  const commit = getHeadCommitHash(repository);
  return { user, directory, location: commit === null ? 'HEAD' : `${shortHash(commit)}...`, state };
}
