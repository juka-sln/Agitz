import { currentBranch, getHeadCommitHash, hasUnmergedPaths } from '@/domain/entities/Repository';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import {
  BadRevisionError,
  OperationInProgressError,
  UnmergedFilesError,
} from '@/domain/errors/OperationErrors';
import { NoCommitsYetError } from '@/domain/errors/RepositoryErrors';
import { tryResolveRevision } from '@/domain/services/revision';

import type { CommandOutcome, GitCommand, GitCommandContext } from './GitCommand';
import {
  abortSequence,
  continueSequence,
  runSequence,
  skipSequence,
  type SequenceKind,
} from './support/sequencer';

export type SequenceInput =
  | { readonly action: 'start'; readonly commits: readonly string[] }
  | { readonly action: 'continue' | 'skip' | 'abort' };

const GERUNDS: Record<SequenceKind, string> = {
  'cherry-pick': 'Cherry-picking',
  revert: 'Reverting',
  rebase: 'Rebasing',
};

/** Shared by cherry-pick and revert: both apply (or undo) the given commits one by one on HEAD. */
export function executeSequenceCommand(
  context: GitCommandContext,
  workspace: Workspace,
  kind: 'cherry-pick' | 'revert',
  input: SequenceInput,
): CommandOutcome {
  switch (input.action) {
    case 'continue':
      return continueSequence(context, workspace, kind);
    case 'skip':
      return skipSequence(context, workspace, kind);
    case 'abort':
      return abortSequence(workspace, kind);
    case 'start':
      break;
  }

  const repository = requireRepository(workspace);
  if (hasUnmergedPaths(repository)) {
    throw new UnmergedFilesError(GERUNDS[kind]);
  }
  if (repository.operation) {
    throw new OperationInProgressError(repository.operation.type);
  }
  const head = getHeadCommitHash(repository);
  if (head === null) {
    throw new NoCommitsYetError(currentBranch(repository) ?? 'HEAD');
  }
  const todo = input.commits.map((revision) => {
    const hash = tryResolveRevision(repository, revision);
    if (hash === null) {
      throw new BadRevisionError(revision);
    }
    return hash;
  });

  return runSequence(context, workspace, {
    kind,
    todo,
    origHead: head,
    branch: currentBranch(repository),
    onto: null,
    total: todo.length,
  });
}

/** Copies the changes of existing commits onto the current branch as new commits. */
export class CherryPickCommand implements GitCommand<SequenceInput> {
  private readonly context: GitCommandContext;

  constructor(context: GitCommandContext) {
    this.context = context;
  }

  execute(workspace: Workspace, input: SequenceInput): CommandOutcome {
    return executeSequenceCommand(this.context, workspace, 'cherry-pick', input);
  }
}
