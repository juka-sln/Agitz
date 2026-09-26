import { StatusCommand } from '@/application/git-commands/StatusCommand';

import type { CliCommand } from '../CliCommand';
import { NotSupportedError } from '../CommandLineErrors';
import { hasOption } from '../parseArguments';

export function createStatusCliCommand(): CliCommand {
  const command = new StatusCommand();
  return {
    name: 'status',
    summary: 'Show the working tree status',
    usage: 'git status [-s | --short]',
    options: [{ name: 'short', short: 's', long: 'short' }],
    execute(args, workspace) {
      if (args.positionals.length > 0 || (args.afterSeparator ?? []).length > 0) {
        throw new NotSupportedError('filtering git status by path');
      }
      return command.execute(workspace, { short: hasOption(args, 'short') });
    },
  };
}
