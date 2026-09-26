import { AddCommand } from '@/application/git-commands/AddCommand';
import type { GitCommandContext } from '@/application/git-commands/GitCommand';

import type { CliCommand } from '../CliCommand';
import { hasOption } from '../parseArguments';

export function createAddCliCommand(context: GitCommandContext): CliCommand {
  const command = new AddCommand(context);
  return {
    name: 'add',
    summary: 'Add file contents to the index',
    usage: 'git add [<options>] [--] <pathspec>...',
    options: [
      { name: 'all', short: 'A', long: 'all' },
      { name: 'update', short: 'u', long: 'update' },
    ],
    execute(args, workspace) {
      return command.execute(workspace, {
        pathspecs: [...args.positionals, ...(args.afterSeparator ?? [])],
        all: hasOption(args, 'all'),
        update: hasOption(args, 'update'),
      });
    },
  };
}
