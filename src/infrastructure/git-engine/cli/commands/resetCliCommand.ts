import { ResetCommand, type ResetMode } from '@/application/git-commands/ResetCommand';

import type { CliCommand } from '../CliCommand';
import { hasOption } from '../parseArguments';

export function createResetCliCommand(): CliCommand {
  const command = new ResetCommand();
  return {
    name: 'reset',
    summary: 'Reset current HEAD to the specified state',
    usage: [
      'git reset [--soft | --mixed | --hard] [<commit>]',
      '   or: git reset [<commit>] [--] <pathspec>...',
    ].join('\n'),
    options: [
      { name: 'soft', long: 'soft' },
      { name: 'mixed', long: 'mixed' },
      { name: 'hard', long: 'hard' },
    ],
    execute(args, workspace) {
      const modes: ResetMode[] = ['soft', 'mixed', 'hard'];
      return command.execute(workspace, {
        mode: modes.find((mode) => hasOption(args, mode)),
        targets: args.positionals,
        paths: args.afterSeparator ?? undefined,
      });
    },
  };
}
