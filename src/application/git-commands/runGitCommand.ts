import type { Workspace } from '@/domain/entities/Workspace';
import { GitError } from '@/domain/errors/GitError';

import { explain, type CommandOutcome, type Explanation } from './GitCommand';
import { diffWorkspaces, NO_CHANGES, type RepoStateDiff } from './RepoStateDiff';

export interface CommandResult extends CommandOutcome {
  readonly diffState: RepoStateDiff;
}

export function unchangedResult(
  workspace: Workspace,
  output: string,
  exitCode: number,
  explanation: Explanation,
): CommandResult {
  return { workspace, output, exitCode, explanation, diffState: NO_CHANGES };
}

/**
 * Runs a use-case and turns Git failures into a regular result, like a terminal would:
 * the workspace is left untouched and the explanation points to the error.
 */
export function runGitCommand(
  workspace: Workspace,
  run: (workspace: Workspace) => CommandOutcome,
): CommandResult {
  try {
    const outcome = run(workspace);
    return { ...outcome, diffState: diffWorkspaces(workspace, outcome.workspace) };
  } catch (error) {
    if (error instanceof GitError) {
      return unchangedResult(
        workspace,
        error.message,
        error.exitCode,
        explain(`error.${error.code}`, error.params),
      );
    }
    throw error;
  }
}
