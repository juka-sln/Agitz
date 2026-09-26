import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import { computeStatus, isWorkingTreeClean } from '@/domain/services/status';

import { explain, succeed, type CommandOutcome, type GitCommand } from './GitCommand';
import { formatLongStatus, formatShortStatus } from './support/formatStatus';

export interface StatusInput {
  readonly short?: boolean;
}

export class StatusCommand implements GitCommand<StatusInput> {
  execute(workspace: Workspace, input: StatusInput): CommandOutcome {
    const repository = requireRepository(workspace);
    const status = computeStatus(repository, workspace.files);
    const output =
      input.short === true
        ? formatShortStatus(repository, status)
        : formatLongStatus(repository, status);

    return succeed(
      workspace,
      output,
      explain(
        isWorkingTreeClean(status) && status.untracked.length === 0
          ? 'status.clean'
          : 'status.changes',
        {
          staged: status.staged.length,
          unstaged: status.unstaged.length,
          untracked: status.untracked.length,
        },
      ),
    );
  }
}
