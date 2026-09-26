import { getHeadCommitHash } from '@/domain/entities/Repository';
import type { Workspace } from '@/domain/entities/Workspace';
import { shortHash } from '@/domain/value-objects/Hash';

export interface PromptParts {
  readonly user: string;
  readonly directory: string;
  /** Branch name, short hash when detached, or null outside a repository. */
  readonly location: string | null;
}

/** The pieces of a git-aware prompt such as `alice@agitz ~/project (main) $`. */
export function describePrompt(workspace: Workspace): PromptParts {
  const user = workspace.identity.name.toLowerCase().replace(/\s+/g, '');
  const directory = `~/${workspace.path.split('/').filter(Boolean).at(-1) ?? ''}`;
  const { repository } = workspace;
  if (!repository) {
    return { user, directory, location: null };
  }
  const { head } = repository;
  if (head.type === 'attached') {
    return { user, directory, location: head.branch };
  }
  const commit = getHeadCommitHash(repository);
  return { user, directory, location: commit === null ? 'HEAD' : `${shortHash(commit)}...` };
}
