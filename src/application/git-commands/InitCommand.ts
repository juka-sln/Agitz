import { createEmptyRepository, DEFAULT_INITIAL_BRANCH } from '@/domain/entities/Repository';
import type { Workspace } from '@/domain/entities/Workspace';
import { InvalidInitialBranchNameError } from '@/domain/errors/BranchErrors';
import { isValidBranchName } from '@/domain/value-objects/BranchName';

import { explain, succeed, type CommandOutcome, type GitCommand } from './GitCommand';

export interface InitInput {
  readonly initialBranch?: string | undefined;
}

export class InitCommand implements GitCommand<InitInput> {
  execute(workspace: Workspace, input: InitInput): CommandOutcome {
    const gitDirectory = `${workspace.path}/.git/`;

    if (workspace.repository) {
      const warning =
        input.initialBranch === undefined
          ? []
          : [`warning: re-init: ignored --initial-branch=${input.initialBranch}`];
      return succeed(
        workspace,
        [...warning, `Reinitialized existing Git repository in ${gitDirectory}`].join('\n'),
        explain('init.reinitialized'),
      );
    }

    const initialBranch = input.initialBranch ?? DEFAULT_INITIAL_BRANCH;
    if (!isValidBranchName(initialBranch)) {
      throw new InvalidInitialBranchNameError(initialBranch);
    }

    return succeed(
      { ...workspace, repository: createEmptyRepository(initialBranch) },
      `Initialized empty Git repository in ${gitDirectory}`,
      explain('init.created', { branch: initialBranch }),
    );
  }
}
