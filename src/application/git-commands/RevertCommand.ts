import type { Workspace } from '@/domain/entities/Workspace';

import { executeSequenceCommand, type SequenceInput } from './CherryPickCommand';
import type { CommandOutcome, GitCommand, GitCommandContext } from './GitCommand';

/** Undoes published commits safely by recording new commits with the opposite changes. */
export class RevertCommand implements GitCommand<SequenceInput> {
  private readonly context: GitCommandContext;

  constructor(context: GitCommandContext) {
    this.context = context;
  }

  execute(workspace: Workspace, input: SequenceInput): CommandOutcome {
    return executeSequenceCommand(this.context, workspace, 'revert', input);
  }
}
